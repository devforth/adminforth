---
slug: compose-ec2-deployment-github-actions-registry
title: Deploy AdminForth to EC2 with terraform on GitHub actions with self-hosted Docker Registry
authors: ivanb
tags: [aws, terraform, github-actions]
---

This guid shows how to deploy AdminFforth to Amazon EC2 with Docker and Terraform involving Registry.

Previously we had a blog post about [deploying AdminForth to EC2 with Terraform without registry](/blog/compose-ec2-deployment-github-actions/). That method might work well but has a significant disadvantage - build process happens on EC2 itself and uses EC2 RAM and CPU. This can be a problem if your EC2 instance is well-loaded without extra free resources. Moreover, low-end EC2 instances have a small amount of RAM and CPU, so build process which involves vite/tsc/etc can be slow or even fail.

So obviously to solve this problem we need to move the build process to CI, however it introduces new chellenges and we will solve them in this post.


Quick difference between approaches from previous post and current post:

| Feature | Without Registry | With Registry |
| --- | --- | --- |
| How and where docker build happens | Source code is copied to EC2 and docker build is done there | Docker build is done on CI and docker image is pushed to registry (in this post we run registry automatically on EC2) |
| Docker build layers cache | Cache is stored on EC2 | GitHub actions has no own Docker cache out of the box, so it should be stored in dedicated place (we use self-hosted registry on the CI as it is free) |
| Advantages | Much simpler setup with less code ( we don't need code to run registry and make it trusted, secured, and don't need extra cache setup as is naturally stored on EC2). | Build is done on CI, so EC2 server is not overloaded. For cheap/middle EC2s CI builds are faster than on EC2. Plus time is saved because we don't need to copy source code to EC2 |
| Disadvantages | Build on EC2 requires additional server RAM / overloads CPU | More terraform code is needed. registry cache might require small extra space on EC2 |



<!-- truncate -->

## Chellenges when you build on CI

A little bit of theory.

When you move build process to CI you have to solve next chellenges:
1) We need to deliver built docker images to EC2 somehow
2) We need to persist cache between builds

### Delivering images

### Exporing images to tar files

Simplest option which you can find is save docker images to tar files and deliver them to EC2. We can easily do it in terraform (using `docker save -o ...` command on CI and `docker load ...` command on EC2). However this option has a significant disadvantage - it is slow. Docker images are big (always include all layers, without any options), so it takes infinity to do save/load and another infinity to transfer them to EC2 (via relatively slow rsync/SSH and relatively GitHub actions outbound connection).

### Docker registry

Second and right option which we will use here - involve Docker registry. Docker registry is a repository which stores docker images. It does storing in a smart way - it stores layers, so if you will update last layer and push it from CI to registry, only last layer will be pushed to registry and then pulled to EC2. 
To give you row compare - whole-layers image might took `1GB`, but last layer created by `npm run build` command might take `50MB`. And most builds you will do only last layer changes, so it will be 20 times faster to push/pull last layer than whole image.
And this is not all, registry uses unencrypted HTTP/2 protocol so it is faster then SSH/rsync encrypted connection. However you have to be careful with this point and provide another way of authentication (so only you and your CI/EC2 can push/pull images).

What docker registry can you use? So you have next options:
1) Docker Hub - most famous. It is free for public images, so literally every opensource project uses it. However it is not free for private images, and you have to pay for it. In this post we are considering you might do development for commercial project, so we will not use it.
2) GHCR - Registry from Google. Has free plan but on it allows to store only 500MB and allows to do 1GB of traffic per month. Then you pay for every extra GB. Probably small images without cache will fit in this plan, but it is not enough for us.
3) Self-hosted registry repository. In our software development company we use Harbor. It is powerfull free open-source registry which can be easily installed. It allows to push and pull without limit. Also it has internal life-cycle rules which remove unnecessary images and layers. Main drawbacks of it - it is not so fast to install and configure, plus you have to get domain and another server to run it. So unless you are not software dev company, it is not worth to use it.
4) Self-hosted registry on EC2 itself using official `registry` image. So since we already have EC2, we can run registry on it directly. The `registry` container is pretty low-weight and easy to setup and it will not consume a lot of extra CPU/RAM on server. Plus images will be stored close to application so pull will be fast. 

In the post we will use last (4th way). Our terraform will DevOps registry it automatically, so you don't have to do anything special. There are some tricks of course, but our terraform will handle them.

### Persisting cache

Docker builds without layers cache persisting are possible but are very slow. Most build only couple of layers changed, and having no ability to cache them will cause docker builder to regenerate all layers from scratch. It depends, but might for example cause time docker build time increase from a minute to a 10 minutes or even more.

When you build on GitHub actions you have to persist cache between builds. Out of the box GitHub actions can't save anything between builds, so you have to use external storage.

> Though some CI systems can persist docker build cache, e.g. open-source self-hosted Woodpecker CI des it out of the box. However GitHub actions reasonably can't allow such free storage to anyone

So when build-in Docker cache can't be used, there is one alternative - Docker BuildKit external cache. 
So BuildKit allows you to connect external storage. There are several options, but most sweet for us is using Docker registry as cache storage (not only as images storage). However drowback appears here. 
Previously we used docker compose to run our app, it can be used to both build and deploy images, but has [issues with external cache connection](https://github.com/docker/compose/issues/11072#issuecomment-1848974315). While they are not solved we have to use `docker buildx bake` command to build images. It is not so bad, but is another point of configuration which we will cover in this post.

# Practice - deploy AdminForth to EC2 with terraform on GitHub actions with self-hosted Docker Registry


Assume you have your AdminForth project in `myadmin`.


## Step 1 - Dockerfile

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


## Step 2 - compose.yml

create folder `deploy` and create file `compose.yml` inside:

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
    image: localhost:5000/comyadminre:latest
    pull_policy: always
    restart: always
    env_file:
      - .env.live
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
```

## Step 5 - Main terraform file main.tf


First of all install Terraform as described here [terraform installation](https://developer.hashicorp.com/terraform/install#linux).


Create file `main.tf` in `deploy` folder:

```hcl title="deploy/main.tf"

locals {
  app_name = "<your_app_name>"
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

  ingress {
    description = "Allow Docker registry"
    from_port   = 5000
    to_port     = 5000
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
    volume_size = 40 // Size in GB for root partition
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

    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin screen

    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ubuntu
  EOF

  tags = {
    Name = "${local.app_name}-instance"
  }
}

resource "null_resource" "setup_registry" {
  provisioner "local-exec" {
    command = <<-EOF
      echo "Generating secret for local registry"
      sha256sum ./.keys/id_rsa | cut -d ' ' -f1 | tr -d '\n' > ./.keys/registry.pure

      echo "Creating htpasswd file for local registry"
      docker run --rm --entrypoint htpasswd httpd:2 -Bbn ci-user $(cat ./.keys/registry.pure) > ./.keys/registry.htpasswd

      echo "Copying registry secret files to the instance"
      rsync -t -avz -e "ssh -i ./.keys/id_rsa -o StrictHostKeyChecking=no" \
        ./.keys/registry.* ubuntu@${aws_eip_association.eip_assoc.public_ip}:/home/ubuntu/registry-auth
    EOF
  }

  provisioner "remote-exec" {
    inline = [<<-EOF
      # wait for docker to be installed and started
      bash -c 'while ! command -v docker &> /dev/null; do echo \"Waiting for Docker to be installed...\"; sleep 1; done'
      bash -c 'while ! docker info &> /dev/null; do echo \"Waiting for Docker to start...\"; sleep 1; done'

      # remove old registry if exists
      docker rm -f registry

      # run new registry
      docker run -d --network host \
        --name registry \
        --restart always \
        -v /home/ubuntu/registry-data:/var/lib/registry \
        -v /home/ubuntu/registry-auth:/auth\
        -e "REGISTRY_AUTH=htpasswd" \
        -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
        -e "REGISTRY_AUTH_HTPASSWD_PATH=/auth/registry.htpasswd" \
        registry:2

      EOF
    ]

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("./.keys/id_rsa")
      host        = aws_eip_association.eip_assoc.public_ip
    }
  }

  triggers = {
    always_run = 1 # change number to redeploy registry (if for some reason it was removed)
  }
}


resource "null_resource" "sync_files_and_run" {

  provisioner "local-exec" {
    command = <<-EOF

      # map appserver.local to the instance (in GA we don't know the IP, so have to use DNS mapping)
      grep -q "appserver.local" /etc/hosts || echo "${aws_eip_association.eip_assoc.public_ip} appserver.local" | sudo tee -a /etc/hosts

      # hosts modification may take some time to apply
      sleep 5

      # generate buildx authorization
      sha256sum ./.keys/id_rsa | cut -d ' ' -f1 | tr -d '\n' > ./.keys/registry.pure
      echo '{"auths":{"appserver.local:5000":{"auth":"'$(echo -n "ci-user:$(cat ./.keys/registry.pure)" | base64 -w 0)'"}}}' > ~/.docker/config.json

      echo "Running build and push with buildx bake"
      docker buildx bake --progress=plain --push --allow=fs.read=..

      # compose temporarily it is not working https://github.com/docker/compose/issues/11072#issuecomment-1848974315
      # docker compose --progress=plain -p app -f ./compose.yml build --push

      # if you will change host, pleasee add -o StrictHostKeyChecking=no
      echo "Copy files to the instance" 
      rsync -t -avz -e "ssh -i ./.keys/id_rsa -o StrictHostKeyChecking=no" \
        --delete \
        --exclude '.terraform' \
        --exclude '.keys' \
        --exclude 'tfplan' \
        . ubuntu@${aws_eip_association.eip_assoc.public_ip}:/home/ubuntu/app/deploy/
      EOF
  }

  # Run docker compose after files have been copied
  provisioner "remote-exec" {
    inline = [<<-EOF
      # wait for docker to be installed and started
      bash -c 'while ! command -v docker &> /dev/null; do echo \"Waiting for Docker to be installed...\"; sleep 1; done'
      bash -c 'while ! docker info &> /dev/null; do echo \"Waiting for Docker to start...\"; sleep 1; done'
      
      cat /home/ubuntu/registry-auth/registry.pure | docker login localhost:5000 -u ci-user --password-stdin
        
      cd /home/ubuntu/app/deploy

      echo "Spinning up the app"
      docker compose --progress=plain -p app -f compose.yml up -d --remove-orphans

      # cleanup unused cache (run in background to not block terraform)
      screen -dm docker system prune -f
      screen -dm docker exec registry registry garbage-collect /etc/docker/registry/config.yml --delete-untagged=true 
    EOF
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

  depends_on = [aws_instance.app_instance, aws_eip_association.eip_assoc, null_resource.setup_registry]
}


output "instance_public_ip" {
  value = aws_eip_association.eip_assoc.public_ip
}


######### META, tf state ##############


# S3 bucket for storing Terraform state
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${local.app_name}-terraform-state"
}

resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.bucket

  rule {
    status = "Enabled"
    id = "Keep only the latest version of the state file"

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

Open or create file `~/.aws/credentials` and add (if not already there):

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
name: Deploy upworker
run-name: ${{ github.actor }} builds upworker 🚀
on: [push]
jobs:
  Explore-GitHub-Actions:
    runs-on: ubuntu-latest

    concurrency:
      group: build-group
      cancel-in-progress: false

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
      

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        with:
        # use 127.0.0.1 for dns
          buildkitd-config-inline: |
            [registry."appserver.local:5000"]
              http = true
              
          # use host network
          driver-opts: network=host

      - run: echo "💡 The ${{ github.repository }} repository has been cloned to the runner."
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


Now you can push your changes to GitHub and see how it will be deployed automatically.