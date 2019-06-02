FROM node:10

RUN mkdir -p /app
WORKDIR /app

ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

COPY package.json /app/
COPY package-lock.json /app/
RUN npm install --production

COPY src /app/src
COPY static /app/static
VOLUME [ "/app/config.js", "/app/data" ]

EXPOSE 9000

CMD ["npm", "run", "start"]
