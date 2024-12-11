---
slug: backup-database-to-aws-glacier
title: Backup database to AWS Glacier
authors: ivanb
tags: [aws, terraform]
---

Every reliable system requires a backup strategy. 

If you have no own backup infrastructure, here can suggest a small docker container that will help you to backup your database to AWS Glacier.

As a base guide we will use a previous blog post about [deploying adminforth infrastructure](/blog/compose-ec2-deployment-github-actions).


First we need to allocate a new bucket in AWS S3 with modifying terraform configuration:

```hcl title="deploy/main.tf"
resource "aws_s3_bucket" "backup_bucket" {
  bucket = "${local.app_name}-backups"
}

resource "aws_s3_bucket_lifecycle_configuration" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.bucket

  rule {
    id     = "glacier-immediate"
    status = "Enabled"

    transition {
      days          = 0
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_iam_user" "backup_user" {
  name = "${local.app_name}-backup-user"
}

resource "aws_iam_access_key" "backup_user_key" {
  user = aws_iam_user.backup_user.name
}

resource "aws_iam_user_policy" "backup_user_policy" {
  name = "${local.app_name}-backup-policy"
  user = aws_iam_user.backup_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.backup_bucket.arn,
          "${aws_s3_bucket.backup_bucket.arn}/*"
        ]
      }
    ]
  })
}

```

Also add a section to main.tf to output the new bucket name and credentials:

```hcl title="deploy/main.tf"
      "docker system prune -f",
      # "docker buildx prune -f --filter 'type!=exec.cachemount'",
      "cd /home/ubuntu/app/deploy",
//diff-add      
      "echo 'AWS_BACKUP_ACCESS_KEY=${aws_iam_access_key.backup_user_key.id}' >> .env.live",
//diff-add
      "echo 'AWS_BACKUP_SECRET_KEY=${aws_iam_access_key.backup_user_key.secret}' >> .env.live",
//diff-add
      "echo 'AWS_BACKUP_BUCKET=${aws_s3_bucket.backup_bucket.id}' >> .env.live",
//diff-add
      "echo 'AWS_BACKUP_REGION=${local.aws_region}' >> .env.live",

      "docker compose -p app -f compose.yml --env-file ./.env.live up --build -d --quiet-pull"
    ]
```


Add new service into compose file:

```yaml title="deploy/compose.yml"

  database_glacierizer:
    image: devforth/docker-database-glacierizer:v1.7

    environment:
      - PROJECT_NAME=MYAPP
      # do backup every day at 00:00
      - CRON=0 0 * * *  

      - DATABASE_TYPE=PostgreSQL
      - DATABASE_HOST=db
      - DATABASE_NAME=adminforth
      - DATABASE_USER=admin
      - DATABASE_PASSWORD=${VAULT_POSTGRES_PASSWORD}
      - GLACIER_EXPIRE_AFTER=90
      - GLACIER_STORAGE_CLASS=flexible
      - GLACIER_BUCKET_NAME=${AWS_BACKUP_BUCKET}

      - AWS_DEFAULT_REGION=${AWS_BACKUP_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_BACKUP_ACCESS_KEY}
      - AWS_SECRET_ACCESS_KEY=${AWS_BACKUP_SECRET_KEY}
```



## Pricing

Just to give you row idea about pricing, here is a small calculation for case when you doing backup once per day (like in config)
* Compressed database backup has size of 50 MB always and not growing. (Compression is already done by glacierizer)
* Cost of glacier every month will be ~$0.80 after first 3 month, and will stay same every next month.  
* On first, second and third month cost will increase slowly from $0.00 to $0.80 per month.

