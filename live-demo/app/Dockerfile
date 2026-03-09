FROM node:20-alpine
WORKDIR /code/
ADD package.json pnpm-lock.yaml /code/
RUN npm i -g corepack@0.31.0
RUN corepack enable
RUN pnpm i  
ADD . /code/
RUN pnpm bundleNow


CMD ["pnpm", "run", "startLive"]