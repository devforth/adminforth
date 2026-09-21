FROM node:24-slim
WORKDIR /code/
RUN corepack enable && corepack install --global pnpm@11.24.0
ADD package.json pnpm-lock.yaml pnpm-workspace.yaml /code/
RUN pnpm i  
ADD . /code/
RUN pnpm exec adminforth bundle
CMD ["sh", "-c", "pnpm migrate:prod && pnpm prod"]
