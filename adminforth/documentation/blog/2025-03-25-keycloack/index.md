---
slug: keycloak-setup-example
title: "Setup AdminForth Authorization via Keycloak"
authors: mpipkun
tags: [keycloak, authentication]
description: "The ultimate guide to setting up AdminForth authorization via Keycloak"
# image: "/ogs/ga-tf-aws.jpg"
---

Keycloak is an open-source identity and access management solution that provides authentication and authorization services. It can be used to secure applications and services by managing user identities, roles, and permissions.

In this guide, we will walk you through the process of setting up AdminForth authorization via Keycloak. Most important we will show you how to set up Keycloak in a Docker container and configure it to work with AdminForth.

<!-- truncate -->

## Prerequisites

- Docker installed on your machine
- Basic knowledge of Docker and Docker Compose

## Step 1: Create a Docker Compose File

Create a `docker-compose.yml` file in your project directory. This file will define the Keycloak service and its configuration.

```yaml
services:
  pg:
    image: postgres:latest
    environment:
      POSTGRES_USER: demo
      POSTGRES_PASSWORD: demo
      POSTGRES_DB: demo
    ports:
      - "5432:5432"
    volumes:
      - pg-data:/var/lib/postgresql/data
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    command: start-dev
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
      - DB_VENDOR=postgres
      - DB_ADDR=pg
      - DB_DATABASE=demo
      - DB_USER=demo
      - DB_PASSWORD=demo
    ports:
      - "8080:8080"
    depends_on:
      - pg
    volumes:
      - keycloak-data:/opt/keycloak/data

volumes:
  keycloak-data:
```

Run service:

```bash
docker compose -p af-dev-demo up -d --build --remove-orphans --wait
```

## Step 2: Singn in to Keycloak and Create a Keycloak Realm

1. Open the Keycloak UI at `http://localhost:8080/`.
2. Sign in with the credentials `admin` and `admin`.

![alt text](image-3.png)

3. Select the "Realms" tab and click `Create Realm`.

![alt text](image-4.png)

4. Enter a name for your realm and click `Create`.

![alt text](image-5.png)

## Step 3: Create a Keycloak Client

1. Go to `Clients` tab and click `Create Client`.

![alt text](image-10.png)

2. Choose `OpenID Connect`, enter a client ID for your client and click `Next`.

![alt text](image.png)

3. Swith `Client authentication` to `On` and click `Next`.

![alt text](image-1.png)

4. Enter a `Valid redirect URI` and click `Save`.

![alt text](image-9.png)

5. In the `Client details` go to `Credentials` tab and copy the `Client secret`.

![alt text](image-2.png)

6. Add the credentials to your `.env` file:

```bash
KEYCLOAK_CLIENT_ID=your_keycloak_client_id
KEYCLOAK_CLIENT_SECRET=your_keycloak_client_secret
KEYCLOAK_REALM=your_keycloak_realm
KEYCLOAK_URL=http://localhost:8080
```

## Step 4: Create a Keycloak User

1. Go to `Users` tab and click `Create new user`.

![alt text](image-6.png)

2. Enter a `Username`, `Email`, `First name` and `Last name` and click `Create`.

![alt text](image-7.png)

3. In the  `User details` go to `Credentials` tab and click `Set password`.

![alt text](image-12.png)

4. Enter a `Password`, turn `Temporary` to `Off` and click `Save`.

![alt text](image-8.png)

Finally, you can sign in to AdminForth with your Keycloak credentials. (if user with the same email exists in AdminForth)