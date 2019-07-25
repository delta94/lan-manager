#Builder image
FROM node:10 as builder

RUN mkdir -p /app
WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY tasks ./tasks
COPY tasks.js .

COPY assets ./assets
COPY webpack.config.js .

RUN NODE_ENV=production npm run build

#Final image
FROM node:10-alpine

RUN mkdir -p /app
WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install --production

COPY mikronode.patch .
RUN patch ./node_modules/mikronode/dist/mikronode.js mikronode.patch

COPY --from=builder /app/public ./public
COPY src ./src

CMD ["npm", "run", "start"]
