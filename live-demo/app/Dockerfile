FROM node:26-alpine AS build
WORKDIR /code/
RUN npm i -g pnpm@12
ADD package.json pnpm-lock.yaml pnpm-workspace.yaml /code/
RUN pnpm i
ADD . /code/
RUN pnpm bundleNow
RUN pnpm run build

FROM node:26-alpine
WORKDIR /code/
RUN npm i -g pnpm@12 && npm cache clean --force
COPY --from=build /code/node_modules node_modules
COPY --from=build /code/dist dist
COPY --from=build /code/custom custom
COPY --from=build /code/langs langs
COPY --from=build /code/migrations migrations
COPY --from=build /code/package.json /code/pnpm-lock.yaml /code/pnpm-workspace.yaml /code/schema.prisma ./

CMD ["pnpm", "run", "startLive"]