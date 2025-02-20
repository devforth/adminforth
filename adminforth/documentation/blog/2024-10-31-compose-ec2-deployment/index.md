---
slug: compose-ec2-deployment
title: Deploy AdminForth to EC2 with terraform (without CI)
authors: ivanb
tags: [aws, terraform]
---

Here is a row snippet to deploy AdminForth to Terraform.

<!-- truncate -->


Assume you have your AdminForth project in `myadmin`.

Create file `Dockerfile` in `myadmin`:

```Dockerfile title="./myadmin/Dockerfile"
# use the same node version which you used during dev
FROM node:20-alpine
WORKDIR /code/
ADD package.json package-lock.json /code/
RUN npm ci  
ADD . /code/
RUN --mount=type=cache,target=/tmp npx tsx bundleNow.ts
CMD ["npm", "run", "startLive"]
```


Create file `compose.yml`:

```yml title="compose.yml"

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
    build: ./myadmin
    restart: always
    env_file:
      - ./myadmin/.env
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



Create file `main.tf`:

```hcl title="main.tf"

provider "aws" {
  region = "eu-central-1"
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
 vpc = true
}
resource "aws_eip_association" "eip_assoc" {
 instance_id   = aws_instance.myadmin_instance.id
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
    values = ["eu-central-1a"]
  }
}


resource "aws_security_group" "instance_sg" {
  name   = "myadmin-instance-sg"
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

resource "aws_key_pair" "myadmin_deploy_key" {
  key_name   = "terraform-myadmin_deploy_key-key"
  public_key = file("~/.ssh/id_rsa.pub") # Path to your public SSH key
}


resource "aws_instance" "myadmin_instance" {
  ami                    = data.aws_ami.ubuntu_linux.id
  instance_type          = "t3a.small"
  subnet_id              = data.aws_subnet.default_subnet.id
  vpc_security_group_ids = [aws_security_group.instance_sg.id]
  key_name               = aws_key_pair.myadmin_deploy_key.key_name

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
  EOF

  tags = {
    Name = "myadmin-instance"
  }
}

resource "null_resource" "sync_files_and_run" {
  # Use rsync to exclude node_modules, .git, db
  provisioner "local-exec" {
    # heredoc syntax
    command = <<-EOF
    rsync -t -av \
      --delete \
      --exclude 'node_modules' \
      --exclude '.git' \
      --exclude '.terraform' \
      --exclude 'terraform*' \
      --exclude '.vscode' \
      --exclude 'db' \
      ./ ubuntu@${aws_eip_association.eip_assoc.public_ip}:/home/ubuntu/app/
    EOF
    
  }

  # Run docker compose after files have been copied
  provisioner "remote-exec" {
    inline = [
      "bash -c 'while ! command -v docker &> /dev/null; do echo \"Waiting for Docker to be installed...\"; sleep 1; done'",
      "bash -c 'while ! docker info &> /dev/null; do echo \"Waiting for Docker to start...\"; sleep 1; done'",
      # -a would destroy cache
      "docker system prune -f",
      "cd /home/ubuntu/app/",
      # COMPOSE_FORCE_NO_TTY is needed to run docker compose in non-interactive mode and prevent stdout mess up
      "COMPOSE_FORCE_NO_TTY=1 docker compose -f compose.yml up --build -d"
    ]

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("~/.ssh/id_rsa")
      host        = aws_eip_association.eip_assoc.public_ip
    }
  }

  # Ensure the resource is triggered every time based on timestamp or file hash
  triggers = {
    always_run = timestamp()
  }

  depends_on = [aws_instance.myadmin_instance, aws_eip_association.eip_assoc]
}


output "instance_public_ip" {
  value = aws_eip_association.eip_assoc.public_ip
}
```


To run the deployment first time, you need to run:

```bash
terraform init
```

Then with any change in code:

```bash
terraform apply -auto-approve
```