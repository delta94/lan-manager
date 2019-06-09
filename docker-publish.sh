#!/usr/bin/env bash

#Build project
npm run build

#Get git commit hash
HASH="$(git rev-parse --short HEAD)"

#Build container then tag with commit hash
docker build -t subash/lan-manager:$HASH .

#Publish container
docker push subash/lan-manager:$HASH
