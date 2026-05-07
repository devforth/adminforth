FROM node:22-alpine
WORKDIR /code/
ADD package.json pnpm-lock.yaml pnpm-workspace.yaml /code/
# RUN npm i -g corepack@0.31.0
RUN corepack enable
RUN pnpm config set ignore-scripts false
RUN pnpm approve-builds --all
RUN pnpm install --frozen-lockfile
ADD . /code/
RUN pnpm bundleNow


CMD ["pnpm", "run", "startLive"]