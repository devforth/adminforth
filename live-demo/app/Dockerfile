FROM node:20-alpine
WORKDIR /code/
ADD package.json pnpm-lock.yaml pnpm-workspace.yaml /code/
# RUN npm i -g corepack@0.31.0
RUN npm i -g pnpm@latest-10
RUN corepack enable
RUN pnpm i  
ADD . /code/
RUN pnpm bundleNow


CMD ["pnpm", "run", "startLive"]