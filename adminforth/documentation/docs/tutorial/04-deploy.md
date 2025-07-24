# Deploy in Docker

In general you can already run your `index.ts` file which we created in [Getting Started](/docs/tutorial/001-gettingStarted.md)
with `ts-node` command in any node environment.

It will start the server on configured HTTP port and you can use any proxy like Traefik/Nginx to expose it to the internet and add SSL Layer.

## Dockerfile

If you created your AdminForth application with `adminforth create-app` command you already have a `Dockerfile` in your project.

You can use it to build your AdminForth application in Docker container.

> ⚠️ Please note that `Dockerfile` has `npx adminforth bundle` command which pre-bundles your AdminForth SPA
> at build time. If you will remove it, your AdminForth application will still work, but will cause some downtime during app restart/redeploy because bundling will happen at runtime after you start the `index.ts` file. When `npx adminforth bundle` command is executed at build time, the call do `bundleNow()` inside of `index.ts` file will actually do nothing.


## Building the image

Now you can build your image:

```bash
docker build -t myadminapp .
```

And run container with:

```bash
docker run -p 3500:3500 \
  -e ADMINFORTH_SECRET=CHANGEME \
  -v $(pwd)/db:/code/db \
  myadminapp
```

> `-v $(pwd)/db:/code/db` is needed only if you are using SQLite database.

Now open your browser and go to `http://localhost:3500` to see your AdminForth application running in Docker container.

## Automating deployments with CI

If you are looking for a professional way to deploy your AdminForth application, you can follow our blog post [how to deploy your AdminForth application with Terraform From GitHub actions](https://adminforth.dev/blog/compose-aws-ec2-ecr-terraform-github-actions/)

## Adding SSL (https) to AdminForth

There are lots of ways today to put your application behind SSL gateway. You might simply put AdminForth instance behind free Cloudflare CDN, change 3500 port to 80 and Cloudflare will automatically add SSL layer and faster CDN for your application.

However as a bonus here we will give you independent way to add free LetsEncrypt SSL layer to your AdminForth application.

In a folder which contains folder of your AdminForth application (e.g. `adminforth-app`) create a file `compose.yml`:

```yaml title='./compose.yml'
version: '3.8'

services:
  traefik:
    image: "traefik:v2.5"
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.httpchallenge=true"
      - "--certificatesresolvers.myresolver.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.myresolver.acme.email=demo@devforth.io" #  ☝️ replace with your email
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"
    labels:
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
      - "traefik.http.routers.http-catchall.rule=hostregexp(`{host:.+}`)"
      - "traefik.http.routers.http-catchall.entrypoints=web"
      - "traefik.http.routers.http-catchall.middlewares=redirect-to-https"
      - "traefik.http.routers.http-catchall.tls=false"

  adminforth:
    build: ./adminforth-app
    environment:
      - NODE_ENV=production
      - ADMINFORTH_SECRET=!CHANGEME! # ☝️ replace with your secret
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.adminforth.tls=true"
      - "traefik.http.routers.adminforth.tls.certresolver=myresolver"
      - "traefik.http.routers.adminforth.rule=PathPrefix(`/`)"
      - "traefik.http.services.adminforth.loadbalancer.server.port=3500"
      - "traefik.http.routers.adminforth.priority=1"
    # needed only if you are using SQLite
    volumes:
      - db:/code/db

# needed only if you are using SQLite
volumes:
  db:

networks:
  default:
    driver: bridge
```

Now pull this compose file and all directories to your server and run:

```bash
docker compose -p stack-my-app -f compose.yml up -d --build --remove-orphans --wait
```

> ☝️ You can also test this compose stack locally on your machine but SSL will not work,
> so locally you can ignore Chrome warning about SSL and test your AdminForth application.

## Subpath deployment

If you want to deploy your AdminForth application to a sub-folder like `https://mydomain.com/admin` you
should do the following:

1) Open `index.ts` file and change `ADMIN_BASE_URL` constant to your subpath:

```ts title='./index.ts'
//diff-remove
const ADMIN_BASE_URL = '';
//diff-add
const ADMIN_BASE_URL = '/admin/';
```

2) Open `compose.yml` file and change `traefik.http.routers.adminforth.rule` to your subpath:

```yml title='./compose.yml'
      ...
       - "traefik.http.routers.adminforth.tls.certresolver=myresolver"
//diff-remove
      - "traefik.http.routers.adminforth.rule=PathPrefix(`/`)"
//diff-add
      - "traefik.http.routers.adminforth.rule=PathPrefix(`/admin/`)"
```

Redeploy compose.

Now you can access your AdminForth application by going to `https://mydomain.com/admin`.

If you want to automate the deployment process with CI follow [our docker - traefik guide](https://devforth.io/blog/onlogs-open-source-simplified-web-logs-viewer-for-dockers/)

# Nginx version

If you are using Nginx instead of traefik, here is siple proxy pass config:

```
server {
  listen 80;
  server_name demo.adminforth.dev;

  charset utf-8;
  client_max_body_size 75M;

  gzip on;
  gzip_disable "msie6";
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 8;
  gzip_buffers 16 8k;
  gzip_http_version 1.1;
  gzip_min_length 2000;
  gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml image/x-icon;

  location / {
      proxy_read_timeout 220s;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Host $http_host;
      proxy_redirect off;
      proxy_pass http://127.0.0.1:3500;
  }
}
```

# Environment variables best practices

Use `.env` file for sensitive variables like `OPENAI_API_KEY` locally.

Use `.env.prod` and `.env.local` for non-sensitive variables which are different for production and local environemnts (like NODE_ENV, SOME_EXTERNAL_API_BASE, etc).

Sensitive variables like `OPENAI_API_KEY` in production should be passed directly to docker container or use secrets from your vault.


# If you are not using Docker

You can actually ship your AdminForth application without Docker as well. 

Most important thing is remember in such case is to use `npx adminforth bundle` command after you installed node modules and before you do actual restart of your application to avoid downtimes.