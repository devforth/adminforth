# Deploy in Docker

In general you can already run your `index.ts` file which we created in [Getting Started](/docs/tutorial/01-gettingStarted.md)
with `ts-node` command in any node environment.

It will start the server on configured HTTP port and you can use any proxy like Traefik/Nginx to expose it to the internet and add SSL Layer.

## Building SPA in Docker build time

In current index.ts file you might use call to `bundleNow` method which starts building internal SPA bundle when `index.ts` started 
executing. SPA building generally takes from 10 seconds to minute depending on the external modules you will add into AdminForth and extended functionality you will create.

To fully exclude this bundle time we recommend doing bundling in build time.

Create file `bundleNow.ts` in the root directory of your project:

and put the following code:

```ts title='./bundleNow.ts'
import { admin } from './index.js';

await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development'});
console.log('Bundling AdminForth done.');
```

Now completely Remove bundleNow call from `index.ts` file:

```ts title='./index.ts'
//diff-remove
(async () => {
//diff-remove
      // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
//diff-remove
  await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development'});
//diff-remove
  console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');
//diff-remove
})();
```

In root directory create file `.dockerignore`:

```bash title='./.dockerignore'
node_modules
*.sqlite
```


In root directory create file `Dockerfile`:

```Dockerfile
# use the same nove devsion which you used during dev
FROM node:20 
WORKDIR /code/
ADD package.json package-lock.json /code/
RUN npm ci  
ADD . /code/
RUN npm run bundleNow
CMD ["npm", "run", "startLive"]
```

Add `bundleNow` and `startLive` to `package.json`
```ts title='./package.json'
{
    "type": "module",
    "scripts": {
        "start": "ADMINFORTH_SECRET=CHANGE_ME_IN_PRODUCTION NODE_ENV=development tsx watch index.ts",
//diff-add
        "bundleNow": "tsx bundleNow.ts",
//diff-add
        "startLive": "NODE_ENV=production tsx index.ts"
    },
}
```


Now you can build your image:

```bash
docker build -t myadminapp .
```

And run container with:

```bash
docker run -p 3500:3500 \
  -e NODE_ENV=production -e ADMINFORTH_SECRET=CHANGEME\
  myadminapp
```


Now open your browser and go to `http://localhost:3500` to see your AdminForth application running in Docker container.


## Adding SSL (https) to AdminForth

There are lots of ways today to put your application behind SSL gateway. You might simply put AdminForth instance behind free Cloudflare CDN,
change 3500 port to 80 and Cloudflare will automatically add SSL layer and faster CDN for your application.

However as a bonus here we will give you independent way to add free LetsEncrypt SSL layer to your AdminForth application.

First move all contents of your root folder (which contains index.ts and other files) to `app` folder:

```bash
mkdir app
mv {.,}*  app
```

In root directory create file `compose.yml`:

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
      - "--certificatesresolvers.myresolver.acme.email=demo@devforth.io" #  ⚠️ replace with your email
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
    build: ./app
    environment:
      - NODE_ENV=production
      - ADMINFORTH_SECRET=!CHANGEME! # ⚠️ replace with your secret
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.adminforth.tls=true"
      - "traefik.http.routers.adminforth.tls.certresolver=myresolver"
      - "traefik.http.routers.adminforth.rule=PathPrefix(`/`)"
      - "traefik.http.services.adminforth.loadbalancer.server.port=3500"
      - "traefik.http.routers.adminforth.priority=1"
   

networks:
  default:
    driver: bridge
```

Now pull this compose file and all directories to your server and run:

```bash
docker compose -p stack-my-app -f compose.yml up -d --build --remove-orphans --wait
```

> 🫨 You can also test this compose stack locally on your machine but SSL will nto work, 
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