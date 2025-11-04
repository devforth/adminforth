---
slug: k3s-ec2-deployment
title: "IaC Simplified: K3s on EC2 Deployments with Terraform, Docker & Amazon ECR"
authors: kirilldorr
tags: [aws, terraform]
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
compose.yml 
```

## Step 4 - file with secrets for local deploy

Create file `deploy/.env.secrets.prod`

```bash
ADMINFORTH_SECRET=<your_secret>
```


## Step 5 - main terraform file main.tf

First of all install Terraform as described here [terraform installation](https://developer.hashicorp.com/terraform/install#linux).


Create file `main.tf` in `deploy` folder:

```hcl title="deploy/main.tf"

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
 
locals {
  aws_region    = "us-west-2"
  vpc_cidr      = "10.0.0.0/16"
  subnet_a_cidr = "10.0.10.0/24"
  subnet_b_cidr = "10.0.11.0/24"
  az_a          = "us-west-2a"
  az_b          = "us-west-2b"
  cluster_name  = "myapp-k3s"
  app_name      = "<your_app_name>"

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

data "aws_ecr_repository" "app_repo" {
  name = "myadmin"
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

  user_data = <<-EOF
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

    ECR_REGISTRY="${data.aws_ecr_repository.app_repo.registry_id}.dkr.ecr.${local.aws_region}.amazonaws.com"

    echo "LOG Gettong ETC password..."
    ECR_PASSWORD=""
    RETRY_COUNT=0
    MAX_RETRIES=12 

    until [ $RETRY_COUNT -ge $MAX_RETRIES ]; do
      ECR_PASSWORD=$(aws ecr get-login-password --region ${local.aws_region} 2>/dev/null)
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
    
    echo "LOG Creating Kubernetes manifest for our app..."
    cat <<EOT_APP > /tmp/myapp-manifest.yaml
    ---
    apiVersion: v1
    kind: Namespace
    metadata:
      name: ${local.app_name}
    ---
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: ${local.app_name}-deployment
      namespace: ${local.app_name}
    spec:
      replicas: 1
      selector:
        matchLabels:
          app: ${local.app_name}
      template:
        metadata:
          labels:
            app: ${local.app_name}
        spec:
          containers:
          - name: ${local.app_name}
            image: "${data.aws_ecr_repository.app_repo.repository_url}:latest"
            ports:
            - containerPort: ${local.app_container_port}
            env:
            - name: "ADMINFORTH_SECRET"
              value: "${local.admin_secret}"
    ---
    apiVersion: v1
    kind: Service
    metadata:
      name: ${local.app_name}-service
      namespace: ${local.app_name}
    spec:
      type: ClusterIP 
      selector:
        app: ${local.app_name}
      ports:
      - port: ${local.service_port}
        targetPort: ${local.app_container_port}
    ---
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      name: ${local.app_name}-ingress
      namespace: ${local.app_name}
    spec:
      rules:
      - http:
          paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${local.app_name}-service
                port:
                  number: ${local.service_port}
    EOT_APP

    echo "LOG Applying Kubernetes manifest..."
    /usr/local/bin/k3s kubectl apply -f /tmp/myapp-manifest.yaml

    EOF

  # prevent accidental termination of ec2 instance and data loss
  # if you will need to recreate the instance still (not sure why it can be?), you will need to remove this block manually by next command:
  # > terraform taint aws_instance.app_instance
  lifecycle {
    create_before_destroy = true
    prevent_destroy       = true
    ignore_changes        = [ami]
  }

  root_block_device {
    volume_size = 20 // Size in GB for root partition
    volume_type = "gp2"

    # Even if the instance is terminated, the volume will not be deleted, delete it manually if needed
    delete_on_termination = false
  }
}

output "app_endpoint" {
  value = "http://${aws_instance.k3s_server.public_dns}"
}

output "kubectl_config_command" {
  value = "scp -i .keys/k3s-keys.pem ubuntu@${aws_instance.k3s_server.public_dns}:/home/ubuntu/k3s.yaml ~/.kube/config-k3s && export KUBECONFIG=~/.kube/config-k3s"
}

```

> 👆 Replace `<your_app_name>` with your app name (no spaces, only underscores or letters)


### Step 6 - Configure AWS Profile

Open or create file `~/.aws/credentials` and add (if not already there):

```ini
[myaws]
aws_access_key_id = <your_access_key>
aws_secret_access_key = <your_secret_key>
```


### Step 7.2 - Run deployment

All actions related to deployment are automated and written in the script in `user_data`, so no additional actions are required. To deploy the application, you only need to enter the two commands below and wait a few minutes. After that, you can connect to the web application using the link you will receive in `terraform_output`. Next, if you wish, you can add GitHub Actions. To do this, you can use the instructions in [our other post](https://adminforth.dev/blog/compose-aws-ec2-ecr-terraform-github-actions/#chellenges-when-you-build-on-ci).

```bash 
terraform init
```

Now run deployement:

```bash
terraform apply -auto-approve
```
