FROM node:20-alpine
WORKDIR /code/
ADD package.json pnpm-lock.yaml pnpm-workspace.yaml /code/
RUN corepack enable
RUN corepack prepare pnpm@latest-10 --activate
RUN pnpm i  
ADD . /code/
RUN pnpm bundleNow
RUN pnpm run build


CMD ["pnpm", "run", "startLive"]