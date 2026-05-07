FROM node:20-alpine
WORKDIR /code/
ADD package.json pnpm-lock.yaml pnpm-workspace.yaml /code/
RUN pnpm i -g corepack@0.31.0
RUN corepack enable
RUN pnpm i  
ADD . /code/
RUN pnpm bundleNow


CMD ["pnpm", "run", "startLive"]