#!/usr/bin/env node
const assets = require('./tasks/assets');
const docker = require('./tasks/docker');
const run = require('@sbspk/run');
const task = process.argv[2];

(async()=> {
  switch(task) {
    case 'clean':
      await assets.clean();
      break;
    case 'copy':
      await assets.copy();
      break;
    case 'watch':
      await assets.watch();
      break;
    case 'build':
      await assets.build();
      break;
    case 'docker:build':
      await docker.build();
      break;
    case 'docker:push':
      await docker.push();
      break;
    case 'docker:release':
      await docker.build();
      await docker.push();
      break;
    case 'watch-start':
      await assets.build(),
      await Promise.all([
        assets.watch(),
        run('node-dev --no-notify src/index.js', { stdio: 'inherit' })
      ]);
      break;
    default:
      console.log('Invalid Task!');
      process.exit(1);
  }
})();
