const run = require('@sbspk/run');
const path = require('path');
const fs = require('fs-extra');
const ora = require('ora');

const ROOT_DIR = path.resolve(__dirname, '../');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

async function clean() {
  const spinner = ora('Cleaning public').start();
  await fs.remove(PUBLIC_DIR);
  await fs.ensureDir(PUBLIC_DIR);
  spinner.succeed('Cleaned public');
}

async function copyAsset(inputPath) {
  inputPath = path.resolve(ASSETS_DIR, inputPath);
  const relativePath = path.relative(ASSETS_DIR, inputPath);
  const outputPath = path.resolve(PUBLIC_DIR, relativePath);
  const spinner = ora(`Copying ${relativePath}`).start();
  await fs.copy(inputPath, outputPath);
  spinner.succeed(`Copied ${relativePath}`);
}

async function copy() {
  await Promise.all([
    copyAsset('index.html'),
    copyAsset('manifest.webmanifest'),
    copyAsset('img')
  ]);
}

async function webpack() {
  const spinner = ora(`Building app.js`).start();
  await run('webpack --mode=production', { cwd: ROOT_DIR });
  spinner.succeed(`Built app.js`);
}

async function watch() {
  await run('webpack --mode=development --watch', { cwd: ROOT_DIR, stdio: 'inherit' });
}

async function build() {
  await clean();
  await copy();
  await webpack();
}

module.exports = { clean, copy, build, watch };
