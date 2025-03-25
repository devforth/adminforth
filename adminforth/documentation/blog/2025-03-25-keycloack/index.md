---
slug: keycloak-setup-example
title: "Setup AdminForth Authorization via Keycloak"
authors: mpipkun
tags: [keycloak, auth, authorization]
description: "The ultimate guide to setting up AdminForth authorization via Keycloak"
# image: "/ogs/ga-tf-aws.jpg"
---

Keycloak is an open-source identity and access management solution that provides authentication and authorization services. It can be used to secure applications and services by managing user identities, roles, and permissions.

In this guide, we will walk you through the process of setting up AdminForth authorization via Keycloak. Most important we will show you how to set up Keycloak in a Docker container and configure it to work with AdminForth.

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
    command: start-dev --import-realm
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
      - DB_VENDOR=postgres
      - DB_ADDR=pg
      - DB_DATABASE=demo
      - DB_USER=demo
      - DB_PASSWORD=demo
      - KEYCLOAK_IMPORT=/opt/keycloak/data/import/keycloak-realm.json
      - KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID} # TODO how to generate this values? Are they needed here at all
      - KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET} # TODO  how to generate this values? Are they needed here at all
      - KEYCLOAK_URL=${KEYCLOAK_URL} # TODO  how to generate this values? Are they needed here at all
      - KEYCLOAK_REALM=${KEYCLOAK_REALM} # TODO  how to generate this values? Are they needed here at all
    ports:
      - "8080:8080"
    depends_on:
      - pg
    volumes:
      - keycloak-data:/opt/keycloak/data
      - ./keycloak-realm.json:/opt/keycloak/data/import/keycloak-realm.json

volumes:
  keycloak-data:
```

Create `./keycloak-realm.json` file:

```json
{
    "id": "AdminforthRealm",
    "realm": "AdminforthRealm",
    "enabled": true,
    "users": [
      {
        "username": "testuser",
        "enabled": true,
        "credentials": [
          {
            "type": "password",
            "value": "testpassword"
          }
        ],
        "email": "testuser@example.com",
        "emailVerified": true
      }
    ],
    "clients": [
        {
        "clientId": "adminforth-client",
        "enabled": true,
        "publicClient": true,
        "redirectUris": ["*"],
        "defaultClientScopes": ["openid", "email", "profile"]
        }
    ]
  }
```


Run service:

```bash
docker compose -p af-dev-demo up -d --build --remove-orphans --wait
```


# TODO 

What to click to generate client ID and secret?
