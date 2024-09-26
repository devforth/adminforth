#!/bin/bash
set -e
HOST_DOMAIN=3.127.41.171
mkdir -p ~/.docker/$HOST_DOMAIN



HARBOR_USERNAME='robot$adminforth-demo+wp'
HARBOR_REGISTRY_BASE_URL=harbor.devforth.io/adminforth-demo+wp/
docker login -u $HARBOR_USERNAME -p $VAULT_HARBOR_KEY $HARBOR_REGISTRY_BASE_URL

docker compose -p stack-af-live -f compose.yml build
docker compose -p stack-af-live -f compose.yml push


echo "$VAULT_MAIN_CA_PEM_KEY" > ~/.docker/$HOST_DOMAIN/ca.pem
echo "$VAULT_MAIN_KEY_PEM_KEY" > ~/.docker/$HOST_DOMAIN/key.pem
echo "$VAULT_MAIN_CERT_PEM_KEY" > ~/.docker/$HOST_DOMAIN/cert.pem
 
export DOCKER_HOST=tcp://$HOST_DOMAIN:2376
export DOCKER_TLS_VERIFY=1
export DOCKER_CERT_PATH=~/.docker/$HOST_DOMAIN



docker compose -p stack-af-live -f compose.yml  up -d --pull always --remove-orphans --wait

docker builder prune -a -f
docker container prune -f
docker system prune -f
