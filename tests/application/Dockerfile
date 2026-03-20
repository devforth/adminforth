
FROM devforth/node20-pnpm:latest
WORKDIR /code/
ADD package.json pnpm-lock.yaml pnpm-workspace.yaml /code/
RUN pnpm i  
ADD . /code/
RUN pnpm exec adminforth bundle
CMD ["sh", "-c", "pnpm migrate:prod && pnpm prod"]
