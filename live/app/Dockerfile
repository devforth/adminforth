FROM node:20-alpine
RUN --mount=type=cache,target=/tmp
WORKDIR /code/
ADD package.json package-lock.json /code/
RUN npm ci  
ADD . /code/
RUN npm run bundleNow
CMD ["npm", "run", "startLive"]