FROM node:20-alpine
WORKDIR /code/
ADD package.json package-lock.json /code/
RUN npm ci  
ADD . /code/
RUN --mount=type=cache,target=/tmp npm run bundleNow
CMD ["npm", "run", "startLive"]