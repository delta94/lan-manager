const fs = require('fs-extra');
const path = require('path');
const config = require('../../config.js');
const isReachable = require('./is-reachable');
const statsFile = path.resolve(__dirname, '../../data/power-history.json');

async function logStatus() {
  try {
    const data = await getStats();
    data.push({ time: (new Date()).toISOString(), status: await getStatus() });
    saveStats(data);
  } catch (err) {
    console.error(err);
  }
}

async function getStatus() {
  return await isReachable(config.powerMonitor.address);
}

async function getStats() {
  return (await fs.readJSON(statsFile).catch(()=>{})) || [];
}

async function saveStats(data) {
  await fs.outputFile(statsFile, JSON.stringify(data, null, '  '));
}

module.exports = { logStatus, getStats, getStatus };
