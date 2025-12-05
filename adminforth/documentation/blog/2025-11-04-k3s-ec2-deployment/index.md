---
slug: k3s-ec2-deployment
title: "IaC Simplified: K3s on EC2 Deployments with Terraform, Helm, Ansible & Amazon ECR"
authors: kirilldorr
tags: [aws, terraform, helm, k3s, ansible]
description: "The ultimate step-by-step guide to cost-effective, build-time-efficient, and easy managable EC2 deployments using K3s, Terraform, Helm, Ansible, and a Amazon ECR registry."
---

This guide shows how to deploy own Docker apps (with AdminForth as example) to Amazon EC2 instance with K3s and Terraform involving pushing images into Amazon ECR.

Needed resources:
- AWS account where we will auto-spawn EC2 instance. We will use `t3a.small` instance (2 vCPUs, 2GB RAM) which costs `~14$` per month in `us-west-2` region (cheapest region). Also it will take `$2` per month for EBS gp2 storage (20GB) for EC2 instance. 
- Also AWS ECR will charge for `$0.09` per GB of data egress traffic (from EC2 to the internet) - this needed to load docker build cache.

The setup shape:
- Build is done using IaaC approach with HashiCorp Terraform, so almoast no manual actions are needed from you. Every resource including EC2 server instance is described in code which is commited to repo.
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
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-4
chmod 700 get_helm.sh
./get_helm.sh
```

Also you need Doker Daemon running. We recommend Docker Desktop running. ON WSL2 make sure you have Docker Desktop WSL2 integration enabled.

```bash
docker version
```

It is also worth having `kubectl` locally on your machine for more convenient interaction with nodes and pods, but this is not mandatory.

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```

Last step is download ansible:

```bash
sudo add-apt-repository --yes --update ppa:ansible/ansible
sudo apt install ansible -y

```

# Practice - deploy setup

Assume you have your AdminForth project in `myadmin`.

## Step 1 - create a SSH keypair

Make sure you are still in `deploy` folder, run next command:

```bash title="deploy"
mkdir .keys && ssh-keygen -f .keys/id_rsa -N ""
```

Now it should create `deploy/.keys/id_rsa` and `deploy/.keys/id_rsa.pub` files with your SSH keypair. Terraform script will put the public key to the EC2 instance and will use private key to connect to the instance. Also you will be able to use it to connect to the instance manually.

## Step 2 - .gitignore file

Create `deploy/.gitignore` file with next content:

```bash
.terraform/
.keys/
*.tfstate
*.tfstate.*
*.tfvars
tfplan
session-manager-plugin.deb
.terraform.lock.hcl
```

## Step 3 - Terraform folder

First of all install Terraform as described here [terraform installation](https://developer.hashicorp.com/terraform/install#linux).

After this create folder ../deploy/terraform

Create file `main.tf` in `deploy/terraform` folder:

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
  app_name             = "<your_app_name>"
  app_source_code_path = "../../"
  ansible_dir          = "/home/kdoropii/myadmin/deploy/ansible/playbooks"

  ingress_ports = [
    { from = 22, to = 22, protocol = "tcp", desc = "SSH" },
    { from = 80, to = 80, protocol = "tcp", desc = "App HTTP (Traefik)" },
    { from = 443, to = 443, protocol = "tcp", desc = "App HTTPS (Traefik)" },
    { from = 6443, to = 6443, protocol = "tcp", desc = "Kubernetes API" }
  ]
}

provider "aws" {
  region = local.aws_region
  profile = "my_aws"
}

data "aws_ami" "ubuntu_22_04" {
  most_recent = true
  owners      = ["099720109477"] # Canonical ubuntu account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_key_pair" "app_deployer" {
  key_name   = "terraform-deploy_${local.app_name}-key"
  public_key = file("../.keys/id_rsa.pub") # Path to your public SSH key
}

resource "aws_instance" "ec2_instance" {
  instance_type = "t3a.small"
  ami           = data.aws_ami.ubuntu_22_04.id

  iam_instance_profile = aws_iam_instance_profile.instance_profile.name

  subnet_id                   = aws_subnet.public_a.id
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  associate_public_ip_address = true
  key_name                    = aws_key_pair.app_deployer.key_name

  tags = {
    Name = local.app_name
  }

  depends_on = [
    null_resource.docker_build_and_push
  ]

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


resource "local_file" "ansible_inventory" {
  content = <<EOF
[k3s_nodes]
${aws_instance.ec2_instance.public_ip} ansible_user=ubuntu ansible_ssh_private_key_file=../.keys/id_rsa
EOF

  filename = "../ansible/inventory.ini"
}

resource "null_resource" "wait_ssh" {
  depends_on = [aws_instance.ec2_instance]

  provisioner "local-exec" {
    command = <<EOT
    bash -c '
    for i in {1..10}; do
      nc -zv ${aws_instance.ec2_instance.public_ip} 22 && echo "SSH is ready!" && exit 0
      sleep 5
    done
    exit 1
    '
    EOT
  }
}

resource "null_resource" "ansible_provision" {
  depends_on = [
    aws_instance.ec2_instance,
    local_file.ansible_inventory,
    null_resource.wait_ssh
  ]

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]

    command = <<-EOT
      set -e
      ANSIBLE_HOST_KEY_CHECKING=False ansible-galaxy collection install community.kubernetes
      ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i ${path.module}/../ansible/inventory.ini ${local.ansible_dir}/playbook.yaml 
    EOT
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

This file contains a script that builds the Docker image locally. This is done for more flexible deployment. When changing the program code, there is no need to manually update the image on EC2 or in the repository. It is updated automatically with each terraform apply. Below is a table showing the time it takes to build this image from scratch and with minimal changes.

| Feature                        | Time      |
| ------------------------------ | --------- |
| Initial build time\* | 0m45.445s |
| Rebuild time (changed index.ts)\* | 0m26.757s |

<sub>\* All tests done from local machine (Intel(R) Core(TM) i7 9760H, Docker Desktop/Ubuntu 32 GB RAM, 300Mbps up/down) up to working state</sub>

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
  value = "http://${aws_instance.ec2_instance.public_dns}"
}

output "ssh_connect_command" {
  value = "ssh -i .keys/id_rsa ubuntu@${aws_instance.ec2_instance.public_dns}"
}
```

### Step 4 - Helm

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

### Step 5 - Provider Helm

Now we need to create .../deploy/helm and .../deploy/helm/helm_charts folders

you need to create a file `Chart.yaml` in it

```yaml title="deploy/helm/helm_charts/Chart.yaml"
apiVersion: v2
name: myadmin     # <-- replace with the name of your application
description: Helm chart for myadmin app
version: 0.1.0
appVersion: "1.0.0"
```

And `values.yaml`

```yaml title="deploy/helm/helm_charts/values.yaml"
appName: myadmin    # <-- replace with the name of your application
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

The comments in the `values.yaml` and `Chart.yaml` files indicate the names of the variables that need to be replaced. They must correspond to the variables in Ansible, which will be discussed later.

### Step 6 - Ansible

If we explain the logic of deployment, Ansible plays a very important role here. If Terraform is used exclusively to configure cloud infrastructure in AWS, Ansible prepares it for the deployment of a Kubernetes cluster. Ansible Playbooks, in simple terms, are templates for configuring the system (of course, their functionality is much broader, but in this deployment method and in most cases, this is how they are used). That is, after preparing the instance with Terraform, it launches Ansible, which prepares it for the deployment of the Kubernetes cluster, after which it launches Helm.
This method allows for the highest quality deployment, because each stage is handled by software specialized for that particular stage. 

So, create `/deploy/ansible/playbooks` folder

Then the file `playbook.yaml`

```bash title="/deploy/ansible/playbooks/playbook.yaml"
---
- name: Deploy application
  hosts: k3s_nodes
  become: true
  vars:
    k3s_version: "v1.27.3+k3s1"
    helm_version: "v3.12.3"
    kubeconfig_path: /etc/rancher/k3s/k3s.yaml
    helm_url: https://get.helm.sh/helm-v3.12.3-linux-amd64.tar.gz
    helm_dest: /usr/local/bin/helm
    app_name: myadmin
    app_namespace: myadmin 
    chart_path: /home/ubuntu/{{app_name}}/helm_charts

  tasks:

    - name: Install unzip
      apt:
        name: unzip
        state: present
        update_cache: true

    - name: Download AWS CLI v2
      get_url:
        url: "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip"
        dest: /tmp/awscliv2.zip

    - name: Unzip AWS CLI
      unarchive:
        src: /tmp/awscliv2.zip
        dest: /tmp
        remote_src: true

    - name: Install AWS CLI
      command: /tmp/aws/install --update
      args:
        creates: /usr/local/bin/aws

    - name: Update apt cache
      ansible.builtin.apt:
        update_cache: true

    - name: Install required packages
      ansible.builtin.apt:
        name:
          - curl
          - sudo
          - software-properties-common
          - apt-transport-https
          - ca-certificates
        state: present

    - name: Install k3s
      ansible.builtin.shell: |
        curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION={{ k3s_version }} sh -
      args:
        creates: /usr/local/bin/k3s

    - name: Get ECR token
      command: aws ecr get-login-password --region us-west-2
      register: ecr_token

    - name: Configure K3s registry for ECR
      copy:
        dest: /etc/rancher/k3s/registries.yaml
        content: |
          configs:
            "735356255780.dkr.ecr.us-west-2.amazonaws.com":
              auth:
                username: AWS
                password: "{{ ecr_token.stdout }}"

    - name: Restart k3s to apply registry changes
      ansible.builtin.systemd:
        name: k3s
        state: restarted
        enabled: true

    - name: Wait for k3s node to be ready
      ansible.builtin.wait_for:
        path: /usr/local/bin/k3s
        state: present
        timeout: 300

    - name: Ensure ~/.kube directory exists
      ansible.builtin.file:
        path: /root/.kube
        state: directory
        mode: '0700'

    - name: Copy k3s kubeconfig
      ansible.builtin.copy:
        remote_src: true
        src: /etc/rancher/k3s/k3s.yaml
        dest: /root/.kube/config
        owner: root
        group: root
        mode: '0600'

    - name: Replace localhost with public IP in kubeconfig
      ansible.builtin.replace:
        path: /root/.kube/config
        regexp: "server: https://127.0.0.1:6443"
        replace: "server: https://{{ inventory_hostname }}:6443"

    - name: Download Helm tarball
      ansible.builtin.get_url:
        url: "https://get.helm.sh/helm-{{ helm_version }}-linux-amd64.tar.gz"
        dest: "/tmp/helm.tar.gz"
        mode: '0644'

    - name: Extract Helm tarball
      ansible.builtin.unarchive:
        src: "/tmp/helm.tar.gz"
        dest: "/tmp/"
        remote_src: true

    - name: Move Helm binary to /usr/local/bin
      ansible.builtin.command:
        cmd: mv /tmp/linux-amd64/helm /usr/local/bin/helm
        creates: /usr/local/bin/helm

    - name: Ensure python3-pip is installed
      ansible.builtin.apt:
        name: python3-pip
        state: present
        update_cache: true

    - name: Install Python kubernetes library
      ansible.builtin.pip:
        name: kubernetes
        executable: pip3

    - name: Extract Helm binary
      ansible.builtin.unarchive:
        src: /tmp/helm.tar.gz
        dest: /tmp
        remote_src: true
        extra_opts: [--strip-components=1]
        creates: /tmp/helm

    - name: Move Helm binary to /usr/local/bin
      ansible.builtin.command:
        cmd: mv /tmp/helm /usr/local/bin/helm
        creates: /usr/local/bin/helm

    - name: Copy Helm chart to server
      ansible.builtin.copy:
        src: "../../helm/helm_charts"  
        dest: /home/ubuntu/{{app_name}}
        owner: ubuntu
        group: ubuntu
        mode: '0755'
        force: true

    - name: Ensure {{app_namespace}} namespace exists
      kubernetes.core.k8s:
        api_version: v1
        kind: Namespace
        name: myadmin
        kubeconfig: "{{ kubeconfig_path }}"

    - name: Deploy {{app_name}} stack via Helm
      kubernetes.core.helm:
        name: myadmin
        chart_ref: /home/ubuntu/{{app_name}}/helm_charts
        release_namespace: "{{app_namespace}}"
        kubeconfig: "{{ kubeconfig_path }}"
        create_namespace: false
        values_files: 
          - /home/ubuntu/{{app_name}}/helm_charts/values.yaml
        force: true
        atomic: false
```

### Step 7 - Configure AWS Profile

Open or create file `~/.aws/credentials` and add (if not already there):

```ini
[myaws]
aws_access_key_id = <your_access_key>
aws_secret_access_key = <your_secret_key>
```

### Step 8 - Run deployment

All deployment-related actions are automated, so no additional actions are required. To deploy the application, you only need to enter a few commands listed below and wait a few minutes. After that, you will be able to connect to the web application using the link you will receive in `terraform_output`. Next, if you wish, you can add GitHub Actions. To do this, follow the instructions in [our other post](https://adminforth.dev/blog/compose-aws-ec2-ecr-terraform-github-actions/#chellenges-when-you-build-on-ci).

  In ../deploy/terraform folder

```bash 
terraform init
```

```bash
terraform apply -auto-approve
```

### All done!

Your application is now deployed on Amazon EC2 and available on the Internet.
