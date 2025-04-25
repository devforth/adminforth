---
slug: compose-ec2-deployment-github-actions
title: Deploy AdminForth to EC2 with terraform on CI
authors: ivanb
tags: [aws, terraform, github-actions]
---

Here is more advanced snippet to deploy AdminForth to Terraform.

Here Terraform state will be stored in the cloud, so you can run this deployment from any machine including stateless CI/CD.

We will use GitHub Actions as CI/CD, but you can use any other CI/CD, for example self-hosted free WoodpeckerCI.

<!-- truncate -->

Assume you have your AdminForth project in `myadmin`.


## Step 1 - Dockerfile

Create file `Dockerfile` in `myadmin`:

```Dockerfile title="./myadmin/Dockerfile"
# use the same node version which you used during dev
FROM node:22-alpine
WORKDIR /code/
ADD package.json package-lock.json /code/
RUN npm ci  
ADD . /code/
RUN --mount=type=cache,target=/tmp npx tsx bundleNow.ts
CMD ["sh", "-c", "npm run migrate:prod && npm run prod"]
```

## Step 2 - compose.yml

Create folder `deploy` and create file `compose.yml` inside:

```yml title="deploy/compose.yml"

services:
  traefik:
    image: "traefik:v2.5"
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"

  myadmin:
    build: ../myadmin
    restart: always
    env_file:
      - ./myadmin/.env.secrets.prod
    volumes:
      - myadmin-db:/code/db
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.myadmin.rule=PathPrefix(`/`)"
      - "traefik.http.services.myadmin.loadbalancer.server.port=3500"
      - "traefik.http.routers.myadmin.priority=2"

volumes:
  myadmin-db:
```

## Step 3 - create a SSH keypair

Make sure you are in `deploy` folder, run next command here:

```bash title="deploy"
mkdir .keys && ssh-keygen -f .keys/id_rsa -N ""
```

Now it should create `deploy/.keys/id_rsa` and `deploy/.keys/id_rsa.pub` files with your SSH keypair. Terraform script will put the public key to the EC2 instance and will use private key to connect to the instance. Also you will be able to use it to connect to the instance manually.

## Step 4 - .gitignore file

Create `deploy/.gitignore` file with next content:

```bash
.terraform/
.keys/
*.tfstate
*.tfstate.*
*.tfvars
tfplan
.env.secrets.prod
```

## Step 5 - Main terraform file main.tf


First of all install Terraform as described here [terraform installation](https://developer.hashicorp.com/terraform/install#linux).


Create file `main.tf` in `deploy` folder:

```hcl title="deploy/main.tf"

locals {
  app_name = "<your_app_name>" # replace with your app name
  aws_region = "eu-central-1"
}


provider "aws" {
  region = local.aws_region
  profile = "myaws"
}

data "aws_ami" "ubuntu_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

data "aws_vpc" "default" {
  default = true
}

resource "aws_eip" "eip" {
 domain = "vpc"
}

resource "aws_eip_association" "eip_assoc" {
 instance_id   = aws_instance.app_instance.id
 allocation_id = aws_eip.eip.id
}

data "aws_subnet" "default_subnet" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }

  filter {
    name   = "availability-zone"
    values = ["${local.aws_region}a"]
  }
}

resource "aws_security_group" "instance_sg" {
  name   = "${local.app_name}-instance-sg"
  vpc_id = data.aws_vpc.default.id

  ingress {
    description = "Allow HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH
  ingress {
    description = "Allow SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_key_pair" "app_deployer" {
  key_name   = "terraform-deploy_${local.app_name}-key"
  public_key = file("./.keys/id_rsa.pub") # Path to your public SSH key
}

resource "aws_instance" "app_instance" {
  ami                    = data.aws_ami.ubuntu_linux.id
  instance_type          = "t3a.small"
  subnet_id              = data.aws_subnet.default_subnet.id
  vpc_security_group_ids = [aws_security_group.instance_sg.id]
  key_name               = aws_key_pair.app_deployer.key_name

  # prevent accidental termination of ec2 instance and data loss
  # if you will need to recreate the instance still (not sure why it can be?), you will need to remove this block manually by next command:
  # > terraform taint aws_instance.app_instance
  lifecycle {
    prevent_destroy = true
    ignore_changes = [ami]
  }

  root_block_device {
    volume_size = 20 // Size in GB for root partition
    volume_type = "gp2"

    # Even if the instance is terminated, the volume will not be deleted, delete it manually if needed
    delete_on_termination = false
  }

  user_data = <<-EOF
    #!/bin/bash
    sudo apt-get update
    sudo apt-get install ca-certificates curl
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    # Add the repository to Apt sources:
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update

    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ubuntu

    echo "done" > /home/ubuntu/user_data_done
  EOF

  tags = {
    Name = "${local.app_name}-instance"
  }
}

resource "null_resource" "wait_for_user_data" {
  provisioner "remote-exec" {
    inline = [
      "echo 'Waiting for EC2 software install to finish...'",
      "while [ ! -f /home/ubuntu/user_data_done ]; do echo '...'; sleep 2; done",
      "echo 'EC2 software install finished.'"
    ]

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("./.keys/id_rsa")
      host        = aws_eip_association.eip_assoc.public_ip
    }
  }

  depends_on = [aws_instance.app_instance]
}

resource "null_resource" "sync_files_and_run" {
  # Use rsync to exclude node_modules, .git, db
  provisioner "local-exec" {
    # heredoc syntax
    # remove files that where deleted on the source
    command = <<-EOF
    #  -o StrictHostKeyChecking=no
    rsync -t -av -e "ssh -i ./.keys/id_rsa -o StrictHostKeyChecking=no" \
      --delete \
      --exclude 'node_modules' \
      --exclude '.git' \
      --exclude '.terraform' \
      --exclude 'terraform*' \
      --exclude 'tfplan' \
      --exclude '.keys' \
      --exclude '.vscode' \
      --exclude '.env' \
      --exclude 'db' \
      ../ ubuntu@${aws_eip_association.eip_assoc.public_ip}:/home/ubuntu/app/
    EOF
  }

  # Run docker compose after files have been copied
  provisioner "remote-exec" {
    inline = [
      # please note that prune might destroy build cache and make build slower, however it releases disk space
      "docker system prune -f",
      # "docker buildx prune -f --filter 'type!=exec.cachemount'",
      "cd /home/ubuntu/app/deploy",
      # COMPOSE_FORCE_NO_TTY is needed to run docker compose in non-interactive mode and prevent stdout mess up
      "COMPOSE_BAKE=true docker compose --progress=plain -p app -f compose.yml up --build -d"
    ]

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("./.keys/id_rsa")
      host        = aws_eip_association.eip_assoc.public_ip
    }
  }

  # Ensure the resource is triggered every time based on timestamp or file hash
  triggers = {
    always_run = timestamp()
  }

  depends_on = [null_resource.wait_for_user_data, aws_eip_association.eip_assoc]
}


output "instance_public_ip" {
  value = aws_eip_association.eip_assoc.public_ip
}


######### This scetion is for tf state storage ##############

# S3 bucket for storing Terraform state
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${local.app_name}-terraform-state"
}

resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.bucket

  rule {
    status = "Enabled"
    id = "Keep only the latest version of the state file"

    filter {
      prefix = ""
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.bucket

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "AES256"
    }
  }
}
```

> 👆 Replace `<your_app_name>` with your app name (no spaces, only underscores or letters)

### Step 5.1 - Configure AWS Profile

Open or create file ~/.aws/credentials and add (if not already there):

```ini
[myaws]
aws_access_key_id = <your_access_key>
aws_secret_access_key = <your_secret_key>
```

### Step 5.2 - Run deployment

To run the deployment first time, you need to run:

```bash
terraform init
```

Now run deployement:

```bash
terraform apply -auto-approve
```

## Step 6 - Migrate state to the cloud

First deployment had to create S3 bucket for storing Terraform state. Now we need to migrate the state to the cloud.

Add to the end of `main.tf`:

```hcl title="main.tf"

# Configure the backend to use the S3 bucket
terraform {
 backend "s3" {
   bucket         = "<your_app_name>-terraform-state"
   key            = "state.tfstate"  # Define a specific path for the state file
   region         = "eu-central-1"
   profile        = "myaws"
   use_lockfile   = true
 }
}
```

> 👆 Replace `<your_app_name>` with your app name (no spaces, only underscores or letters). 
> Unfortunately we can't use variables, HashiCorp thinks it is too dangerous 😥


Now run:

```bash
terraform init -migrate-state
```

Now run test deployment:

```bash
terraform apply -auto-approve
```

Now you can delete local `terraform.tfstate` file and `terraform.tfstate.backup` file as they are in the cloud now.


## Step 7 - CI/CD - Github Actions

Create file `.github/workflows/deploy.yml`:

```yml title=".github/workflows/deploy.yml"
name: Deploy 
run-name: ${{ github.actor }} builds app 🚀
on: [push]
jobs:
  Explore-GitHub-Actions:
    runs-on: ubuntu-latest
    steps:
      - run: echo "🎉 The job was automatically triggered by a ${{ github.event_name }} event."
      - run: echo "🐧 This job is now running on a ${{ runner.os }} server"
      - run: echo "🔎 The name of your branch is ${{ github.ref }}"
      - name: Check out repository code
        uses: actions/checkout@v4
      - name: Set up Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.10.1 
      - run: echo "💡 The ${{ github.repository }} repository has been cloned to the runner."
      - name: Prepare env
        run: |
          echo "ADMINFORTH_SECRET=$VAULT_ADMINFORTH_SECRET" > deploy/.env.secrets.prod
        env:
          VAULT_ADMINFORTH_SECRET: ${{ secrets.VAULT_ADMINFORTH_SECRET }}
      - name: Start building
        env:
          VAULT_AWS_ACCESS_KEY_ID: ${{ secrets.VAULT_AWS_ACCESS_KEY_ID }}
          VAULT_AWS_SECRET_ACCESS_KEY: ${{ secrets.VAULT_AWS_SECRET_ACCESS_KEY }}
          VAULT_SSH_PRIVATE_KEY: ${{ secrets.VAULT_SSH_PRIVATE_KEY }}
          VAULT_SSH_PUBLIC_KEY: ${{ secrets.VAULT_SSH_PUBLIC_KEY }}
        run: |
          /bin/sh -x deploy/deploy.sh
          
      - run: echo "🍏 This job's status is ${{ job.status }}."
```

### Step 7.1 - Create deploy script

Now create file `deploy/deploy.sh`:

```bash title="deploy/deploy.sh"

# cd to dir of script
cd "$(dirname "$0")"

mkdir -p ~/.aws ./.keys

cat <<EOF > ~/.aws/credentials
[myaws]
aws_access_key_id=$VAULT_AWS_ACCESS_KEY_ID
aws_secret_access_key=$VAULT_AWS_SECRET_ACCESS_KEY
EOF

cat <<EOF > ./.keys/id_rsa
$VAULT_SSH_PRIVATE_KEY
EOF

cat <<EOF > ./.keys/id_rsa.pub
$VAULT_SSH_PUBLIC_KEY
EOF

chmod 600 ./.keys/id_rsa*

# force Terraform to reinitialize the backend without migrating the state.
terraform init -reconfigure
terraform plan -out=tfplan
terraform apply tfplan
```

### Step 7.2 - Add secrets to GitHub

Go to your GitHub repository, then `Settings` -> `Secrets` -> `New repository secret` and add:

- `VAULT_AWS_ACCESS_KEY_ID` - your AWS access key
- `VAULT_AWS_SECRET_ACCESS_KEY` - your AWS secret key
- `VAULT_SSH_PRIVATE_KEY` - make `cat ~/.ssh/id_rsa` and paste to GitHub secrets
- `VAULT_SSH_PUBLIC_KEY` - make `cat ~/.ssh/id_rsa.pub` and paste to GitHub secrets
- `VAULT_ADMINFORTH_SECRET` - your AdminForth secret - random string, for example `openssl rand -base64 32 | tr -d '\n'`

Now you can push your changes to GitHub and see how it will be deployed automatically.