const ora = require('ora');
const path = require('path');
const run = require('@sbspk/run');
const { execSync } = require('child_process');
const ROOT_DIR = path.resolve(__dirname, '../');

function getTag() {
  const out = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR });
  const hash = out.toString('utf-8').trim();
  return `subash/lan-manager:${hash}`;
}

async function build() {
  const tag = getTag();
  const spinner = ora(`Building container ${tag}`).start();
  await run(`docker build -t ${tag} .`, { cwd: ROOT_DIR });
  spinner.succeed(`Built container ${tag}`);
}

async function push() {
  const tag = getTag();
  const spinner = ora(`Pushing container ${tag}`).start();
  await run(`docker push ${tag}`, { cwd: ROOT_DIR });
  spinner.succeed(`Pushed container ${tag}`);
}

module.exports = { build, push };
