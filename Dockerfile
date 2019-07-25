#Builder image
FROM node:10 as builder

RUN mkdir -p /app
WORKDIR /app

COPY package.json /app/
COPY package-lock.json /app/
RUN npm install

COPY assets /app/assets

COPY tasks /app/tasks
COPY tasks.js /app/

COPY webpack.config.js /app/

RUN NODE_ENV=production npm run build

#Final image
FROM node:10-alpine

RUN mkdir -p /app
WORKDIR /app

COPY package.json /app/
COPY package-lock.json /app/
RUN npm install --production

COPY mikronode.patch .
RUN patch ./node_modules/mikronode/dist/mikronode.js mikronode.patch

COPY src /app/src

COPY --from=builder /app/public /app/public

CMD ["npm", "run", "start"]
