FROM node:10

RUN mkdir -p /app
WORKDIR /app

ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

COPY package.json /app/
COPY package-lock.json /app/
RUN npm install

COPY src /app/src

COPY webpack.config.js /app/
COPY assets /app/assets

RUN npm run build

EXPOSE 9000

CMD ["npm", "run", "start"]
