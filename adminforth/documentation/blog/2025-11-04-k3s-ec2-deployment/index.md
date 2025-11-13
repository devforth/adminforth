---
slug: k3s-ec2-deployment
title: "IaC Simplified: K3s on EC2 Deployments with Terraform, Helm & Amazon ECR"
authors: kirilldorr
tags: [aws, terraform, helm, k3s]
description: "The ultimate step-by-step guide to cost-effective, build-time-efficient, and easy managable EC2 deployments using K3s, Terraform, Docker, and a Amazon ECR registry."
---

This guide shows how to deploy own Docker apps (with AdminForth as example) to Amazon EC2 instance with K3s and Terraform involving pushing images into Amazon ECR.

Needed resources:
- AWS account where we will auto-spawn EC2 instance. We will use `t3a.small` instance (2 vCPUs, 2GB RAM) which costs `~14$` per month in `us-west-2` region (cheapest region). Also it will take `$2` per month for EBS gp2 storage (20GB) for EC2 instance. 
- Also AWS ECR will charge for `$0.09` per GB of data egress traffic (from EC2 to the internet) - this needed to load docker build cache.

The setup shape:
- Build is done using IaaC approach with HashiCorp Terraform, so almoast no manual actions are needed from you. Every resource including EC2 server instance is described in code which is commited to repo.
- Docker build process is done on GitHub actions server, so EC2 server is not overloaded with builds
- Docker images and build cache are stored on Amazon ECR
- Total build time for average commit to AdminForth app (with Vite rebuilds) is around 3 minutes.

<!-- truncate -->

## Why exactly K3s?

Previously, our blog featured posts about different types of application deployment, but without the use of Kubernetes. This post will look at the cheapest option for deploying an application using k3s (a lightweight version of k8s Kubernetes). This option is more interesting than most of the alternatives, primarily because of its automation and scalability (it is, of course, inferior to the “older” K8s, but it also requires significantly fewer resources). 

## How we will store containers?

The ECR repository will be used for storage. Since we are working with AWS, this is the most reliable option. The image must be assembled from local files on the machine and then sent to the Amazon server. All instructions for performing these actions will be provided below.

# Prerequisites

I will assume you run Ubuntu (Native or WSL2).

You should have terraform, here is official repository: 

```
wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```


AWS CLI:

```bash
sudo snap install aws-cli --classic
```

HELM:

```bash
curl https://baltocdn.com/helm/signing.asc | sudo tee /etc/apt/trusted.gpg.d/helm.asc
sudo apt-get install apt-transport-https --yes
echo "deb https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt-get install helm
```

Also you need Doker Daemon running. We recommend Docker Desktop running. ON WSL2 make sure you have Docker Desktop WSL2 integration enabled.

```bash
docker version
```

It is also worth having `kubectl` locally on your machine for more convenient interaction with nodes and pods, but this is not mandatory.

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```

# Practice - deploy setup

Assume you have your AdminForth project in `myadmin`.

## Step 1 - create a SSH keypair

Make sure you are still in `deploy` folder, run next command:

```bash title="deploy"
mkdir .keys && ssh-keygen -f .keys/id_rsa -N ""
```

Now it should create `deploy/.keys/id_rsa` and `deploy/.keys/id_rsa.pub` files with your SSH keypair. Terraform script will put the public key to the EC2 instance and will use private key to connect to the instance. Also you will be able to use it to connect to the instance manually.

## Step 2 - create key pairs

I recommend doing this on the official AWS website. Go to EC2>Key pairs>Create key pair, name the new pair k3s-keys, and leave the default settings. Then move the downloaded .pem file to the myadmin/deploy/.keys directory.

## Step 3 - .gitignore file

Create `deploy/.gitignore` file with next content:

```bash
.terraform/
.keys/
*.tfstate
*.tfstate.*
*.tfvars
tfplan
.env.secrets.prod
sa-dash.yaml
session-manager-plugin.deb
.env.secrets.prod
.terraform.lock.hcl
k3s.yaml
```

## Step 4 - file with secrets for local deploy

Create file `deploy/.env.secrets.prod`

```bash
ADMINFORTH_SECRET=<your_secret>
```


## Step 5 - Terraform folder

First of all install Terraform as described here [terraform installation](https://developer.hashicorp.com/terraform/install#linux).

After this create folder ../deploy/terraform

Create file `main.tf` in `deploy` folder:

```hcl title="deploy/terraform/main.tf"

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

}

locals {
  aws_region           = "us-west-2"
  vpc_cidr             = "10.0.0.0/16"
  subnet_a_cidr        = "10.0.10.0/24"
  subnet_b_cidr        = "10.0.11.0/24"
  az_a                 = "us-west-2a"
  az_b                 = "us-west-2b"
  cluster_name         = "myappk3s"
  app_name             = <your_app_name>
  app_source_code_path = "../../"

  app_container_port = 3500
  service_port       = 80
  admin_secret       = "your_secret"

  ingress_ports = [
    { from = 22, to = 22, protocol = "tcp", desc = "SSH" },
    { from = 80, to = 80, protocol = "tcp", desc = "App HTTP (Traefik)" },
    { from = 443, to = 443, protocol = "tcp", desc = "App HTTPS (Traefik)" },
    { from = 6443, to = 6443, protocol = "tcp", desc = "Kubernetes API" }
  ]
}

provider "aws" {
  region = local.aws_region
}

provider "kubernetes" {
  config_path = "../k3s.yaml"
}

data "aws_ami" "ubuntu_22_04" {
  most_recent = true
  owners      = ["099720109477"] # Canonical ubuntu account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "k3s_server" {
  instance_type = "t3a.small"
  ami           = data.aws_ami.ubuntu_22_04.id

  iam_instance_profile = aws_iam_instance_profile.k3s_instance_profile.name

  subnet_id                   = aws_subnet.public_a.id
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  associate_public_ip_address = true
  key_name                    = "k3s-keys"

  tags = {
    Name = local.cluster_name
  }

  depends_on = [
    null_resource.docker_build_and_push
  ]

  user_data = templatefile("../user_data.sh.tpl", {
    app_name           = local.app_name
    aws_region         = local.aws_region
    admin_secret       = local.admin_secret
    app_container_port = local.app_container_port
    service_port       = local.service_port
    ecr_registry_id    = aws_ecr_repository.app_repo.registry_id
    ecr_image_full     = "${aws_ecr_repository.app_repo.repository_url}:latest"
    }
  )

  # prevent accidental termination of ec2 instance and data loss
  lifecycle {
    #create_before_destroy = true       #uncomment in production
    #prevent_destroy       = true       #uncomment in production
    ignore_changes = [ami]
  }

  root_block_device {
    volume_size = 10 // Size in GB for root partition
    volume_type = "gp2"

    # Even if the instance is terminated, the volume will not be deleted, delete it manually if needed
    delete_on_termination = true #change to false in production if data persistence is needed
  }

}

resource "null_resource" "get_kubeconfig" {
  depends_on = [aws_instance.k3s_server]

  provisioner "local-exec" {
    command     = <<-EOT
      set -e
      for i in {1..15}; do
        if nc -z ${aws_instance.k3s_server.public_ip} 22; then
          break
        fi
        sleep 5
      done

      for i in {1..15}; do
        scp -q -o StrictHostKeyChecking=no -i ../.keys/k3s-keys.pem \
          ubuntu@${aws_instance.k3s_server.public_dns}:/home/ubuntu/k3s.yaml ../k3s.yaml && {
            sleep 5
            exit 0
          }

        echo "k3s.yaml not found yet (attempt $i/15), retrying in 10s..."
        sleep 10
      done
    EOT
    interpreter = ["/bin/bash", "-c"]
  }
}
```

> 👆 Replace `<your_app_name>` with your app name (no spaces, only underscores or letters)

We will also need a file `container.tf`

```hcl title="deploy/terraform/container.tf"

resource "aws_ecr_repository" "app_repo" {
  name = local.app_name

  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  force_delete = true
}

data "aws_caller_identity" "current" {}

resource "null_resource" "docker_build_and_push" {

  depends_on = [aws_ecr_repository.app_repo]

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      unset DOCKER_HOST
      
      REPO_URL="${aws_ecr_repository.app_repo.repository_url}"
      ACCOUNT_ID="${data.aws_caller_identity.current.account_id}"
      REGION="${local.aws_region}"
      
      echo "LOG: Logging in to ECR..."
      aws ecr get-login-password --region $${REGION} | docker login --username AWS --password-stdin $${ACCOUNT_ID}.dkr.ecr.$${REGION}.amazonaws.com
      
      echo "LOG: Building Docker image..."
      docker -H unix:///var/run/docker.sock build --pull -t $${REPO_URL}:latest ${local.app_source_code_path}

      echo "LOG: Pushing image to ECR..."
      docker -H unix:///var/run/docker.sock push $${REPO_URL}:latest

      echo "LOG: Build and push complete."
    EOT

    interpreter = ["/bin/bash", "-c"]
  }
}
```

Also, `resvpc.tf`

```hcl title="deploy/terraform/resvpc.tf"
resource "aws_vpc" "main" {
  cidr_block = local.vpc_cidr

  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "main-vpc" }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.subnet_a_cidr
  map_public_ip_on_launch = true
  availability_zone       = local.az_a
  tags = {
    Name = "public-a"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.subnet_b_cidr
  map_public_ip_on_launch = true
  availability_zone       = local.az_b
  tags = {
    Name = "public-b"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "main-igw" }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "public-rt" }
}

resource "aws_route_table_association" "public_a_assoc" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_b_assoc" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_security_group" "app_sg" {
  name   = "app-sg-k3s"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = local.ingress_ports
    content {
      from_port   = ingress.value.from
      to_port     = ingress.value.to
      protocol    = ingress.value.protocol
      cidr_blocks = ["0.0.0.0/0"]
      description = ingress.value.desc
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_iam_role" "k3s_node_role" {
  name = "k3s-node-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_read_only_attach" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.k3s_node_role.name
}

resource "aws_iam_role_policy_attachment" "ssm_core_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.k3s_node_role.name
}

resource "aws_iam_instance_profile" "k3s_instance_profile" {
  name = "k3s-instance-profile"
  role = aws_iam_role.k3s_node_role.name
}
```

And `outputs.tf`

```hcl title="deploy/terraform/outputs.tf"

output "app_endpoint" {
  value = "http://${aws_instance.k3s_server.public_dns}"
}

output "kubectl_config_command" {
  value = "scp -i .keys/k3s-keys.pem ubuntu@${aws_instance.k3s_server.public_dns}:/home/ubuntu/k3s.yaml ~/.kube/config-k3s && export KUBECONFIG=~/.kube/config-k3s"
}

output "ssh_connect_command" {
  value = "ssh -i .keys/k3s-keys.pem ubuntu@${aws_instance.k3s_server.public_dns}"
}

output "instance_public_ip" {
  value = aws_instance.k3s_server.public_ip
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app_repo.repository_url
}

resource "null_resource" "output_to_file" {
  provisioner "local-exec" {
    command = "terraform output -json > ../terraform_outputs.json"
  }
  depends_on = [null_resource.get_kubeconfig]
}
```

### Step 6 - Helm

**Helm** is a command-line tool and a set of libraries that helps manage applications in Kubernetes.

**Helm Chart (Chart)** is a package containing everything needed to run an application in Kubernetes. It's the equivalent of `apt` or `yum` packages in Linux.

A chart has this structure:

```
helm_charts/
├── Chart.yaml        # Metadata about the chart (name, version)
├── values.yaml       # Default values (configuration)
└── templates/        # Folder with Kubernetes templates (YAML files)
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    └── ...
```

### Step 7 - Provider Helm

Now we need to create .../deploy/helm and .../deploy/helm/helm_charts folders

you need to create a file `Chart.yaml` in it

```yaml title="deploy/helm/helm_charts/Chart.yaml"
apiVersion: v2
name: myappk3s
description: Helm chart for myadmin app
version: 0.1.0
appVersion: "1.0.0"
```

And `values.yaml`

```yaml title="deploy/helm/helm_charts/values.yaml"
appName: myappk3s
containerPort: 3500
servicePort: 80
adminSecret: "your_secret"
```
After this create .../deploy/helm/helm_charts/templates folder

And create files here:

  `deployment.yaml`

```yaml title="deploy/helm/helm_charts/templates/deployment.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.appName }}-deployment
  namespace: {{ .Values.appName }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {{ .Values.appName }}
  template:
    metadata:
      labels:
        app: {{ .Values.appName }}
    spec:
      containers:
      - name: {{ .Values.appName }}
        image: "{{ .Values.ecrImageFull }}" 
        ports:
        - containerPort: {{ .Values.containerPort }}
        env:
        - name: "ADMINFORTH_SECRET"
          value: "{{ .Values.adminSecret }}"
```

  `ingress.yaml`

```yaml title="deploy/helm/helm_charts/templates/ingress.yaml"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Values.appName }}-ingress
  namespace: {{ .Values.appName }}
spec:
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {{ .Values.appName }}-service
            port:
              number: {{ .Values.servicePort }}
```

And `service.yaml`

```yaml title="deploy/helm/helm_charts/templates/service.yaml"
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.appName }}-service
  namespace: {{ .Values.appName }}
spec:
  type: ClusterIP
  selector:
    app: {{ .Values.appName }}
  ports:
  - port: {{ .Values.servicePort }}
    targetPort: {{ .Values.containerPort }}

```
### Step 8 - Control Helm

For controlling helm we also use terraform, so we need to create one more folder ../deploy/helm/terraform
And inside it are the files: `main.tf`, `outputs.tf`, `variables.tf`, `terraform.tfvars`.

```hcl title="deploy/helm/terraform/main.tf"
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.0, < 3.0.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 3.0.0"
    }
  }
}

provider "kubernetes" {
  config_path = "../../k3s.yaml"
}

provider "helm" {
  kubernetes = {
    config_path = "../../k3s.yaml"
  }
}

data "local_file" "config_file" {
  filename = "../../terraform_outputs.json"
}

locals {
  config = jsondecode(data.local_file.config_file.content)
}

resource "kubernetes_namespace" "myappk3s" {
  metadata {
    name = "myappk3s"

    labels = {
      "app.kubernetes.io/managed-by" = "Helm"
    }

    annotations = {
      "meta.helm.sh/release-name"      = "myapp"
      "meta.helm.sh/release-namespace" = "myappk3s"
    }
  }
}

resource "helm_release" "myapp" {
  name             = "myapp"
  chart            = "../helm_charts"
  namespace        = kubernetes_namespace.myappk3s.metadata.0.name
  create_namespace = false

  set = [
    {
      name  = "ecrImageFull"
      value = local.config.ecr_repository_url.value
    },
    {
      name  = "image.tag"
      value = "latest"
    },
    {
      name  = "adminSecret"
      value = var.admin_secret
    },
    {
      name  = "ingress.enabled"
      value = "true"
    },
    {
      name  = "ingress.hosts[0].host"
      value = "${local.config.instance_public_ip.value}.nip.io"
    },
    {
      name  = "ingress.hosts[0].paths[0].path"
      value = "/"
    },
    {
      name  = "ingress.hosts[0].paths[0].pathType"
      value = "Prefix"
    },
    {
      name  = "appName"
      value = var.cluster_name
    }
  ]
  depends_on = [kubernetes_namespace.myappk3s]
}
```

```hcl title="deploy/helm/terraform/variables.tf"
variable "admin_secret" {
  description = "Admin secret for the application"
  type        = string
}

variable "cluster_name" {
  description = "The name of the cluster"
  type        = string
}

variable "app_name" {
  type    = string
  default = "myapp"
}
```

```hcl title="deploy/helm/terraform/outputs.tf"
data "local_file" "json_file" {
  filename = "../../terraform_outputs.json"
}

locals {
  duplicated_json = jsondecode(data.local_file.json_file.content)
}

output "ssh_connect_command" {
  value = local.duplicated_json["ssh_connect_command"]["value"]
}

output "kubectl_config_command" {
  value = local.duplicated_json["kubectl_config_command"]["value"]
}

output "app_endpoint" {
  value = local.duplicated_json["app_endpoint"]["value"]
}
```

```hcl title="deploy/helm/terraform/terraform.tfstate"
admin_secret = "your_secret"
cluster_name = "myappk3s"
app_name     = "myapp"
```

### step 9 - ES2 settings instantiation

The configuration will be performed using a small bash script.

Fot this step we need to return to ../deploy folder and create `user_data.sh.tpl`

```bash title="deploy/userdata.sh.tpl"
#!/bin/bash -e

echo "LOG update apt..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y

echo "LOG Installing Docker&AWS CLI..."
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release awscli

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io

echo "LOG Starting Docker..."
systemctl start docker
systemctl enable docker
usermod -a -G docker ubuntu

ECR_REGISTRY="${ecr_registry_id}.dkr.ecr.${aws_region}.amazonaws.com"

echo "LOG Gettong ETC password..."
ECR_PASSWORD=""
RETRY_COUNT=0
MAX_RETRIES=12 

until [ $RETRY_COUNT -ge $MAX_RETRIES ]; do
  
  ECR_PASSWORD=$(aws ecr get-login-password --region ${aws_region} 2>/dev/null)
  if [ -n "$ECR_PASSWORD" ]; then
    echo "LOG Successfull."
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "LOG Retry (for 5s)..."
  sleep 5
done

if [ -z "$ECR_PASSWORD" ]; then
  echo "LOG ERROR: Unable to retrieve ECR password after $MAX_RETRIES attempts."
  exit 1
fi

echo $ECR_PASSWORD | docker login --username AWS --password-stdin $ECR_REGISTRY

if [ $? -ne 0 ]; then
  echo "LOG ERROR: Docker login to ECR failed."
  exit 1
fi
echo "LOG Docker login successful."

echo "LOG Waiting for Docker socket..."
timeout 60 sh -c 'until docker info > /dev/null 2>&1; do echo "LOG Waiting for Docker socket..."; sleep 3; done'

if ! docker info > /dev/null 2>&1; then
  echo "LOG ERROR: Docker socket not available after timeout."
  exit 1
fi

echo "LOG Turning off ufw..."
ufw disable || echo "LOG ufw not installed, skipping disable."

echo "LOG Retrieving public IP..."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "LOG Installing K3s з --tls-san=$${PUBLIC_IP}..."
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--docker --tls-san $${PUBLIC_IP}" sh -

echo "LOG Waiting for k3s.yaml to be created..."
START_TIME=$(date +%s)
until [ -f /etc/rancher/k3s/k3s.yaml ]; do
  CURRENT_TIME=$(date +%s)
  if (( CURRENT_TIME - START_TIME > 300 )); then
    echo "LOG ERROR: Timeout waiting for k3s.yaml."
    echo "LOG k3s.yaml status check:"
    systemctl status k3s.service || systemctl status k3s-server.service || echo "LOG Failed to get k3s service status"
    echo "LOG Last 50 lines of k3s logs:"
    journalctl -u k3s.service -n 50 --no-pager || journalctl -u k3s-server.service -n 50 --no-pager || echo "LOG Failed to get k3s logs"
    exit 1
  fi
  echo "LOG Waiting for k3s.yaml... (passed $(( CURRENT_TIME - START_TIME )) seconds)"
  sleep 5
done

echo "LOG k3s.yaml found."

echo "LOG Updating k3s.yaml with public IP..."
sed -i "s/127.0.0.1/$${PUBLIC_IP}/g" /etc/rancher/k3s/k3s.yaml

echo "LOG Copying k3s.yaml to /home/ubuntu/k3s.yaml..."
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/k3s.yaml
chown ubuntu:ubuntu /home/ubuntu/k3s.yaml
```
### Step 10 - Configure AWS Profile

Open or create file `~/.aws/credentials` and add (if not already there):

```ini
[myaws]
aws_access_key_id = <your_access_key>
aws_secret_access_key = <your_secret_key>
```

### Step 11 - Run deployment

All deployment-related actions are automated and recorded in the script in `user_data.sh.tpl`, so no additional actions are required. To deploy the application, you only need to enter a few commands listed below and wait a few minutes. After that, you will be able to connect to the web application using the link you will receive in `terraform_output`. Next, if you wish, you can add GitHub Actions. To do this, follow the instructions in [our other post](https://adminforth.dev/blog/compose-aws-ec2-ecr-terraform-github-actions/#chellenges-when-you-build-on-ci).

  In ../deploy/terraform folder

```bash 
terraform init
```

```bash
terraform apply -auto-approve
```

Wait for terraform complete the creation of all resources and change directory

```bash
cd ../../helm/terraform
```
And repeat the steps in this directory

```bash 
terraform init
```

```bash
terraform apply -auto-approve
```

### All done!

That's it, your application is deployed on Amazon EC2 and available on the Internet.
