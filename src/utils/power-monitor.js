const fs = require('fs-extra');
const path = require('path');
const { DateTime } = require('luxon');
const config = require('../../config.js');
const isReachable = require('./is-reachable');

function getStatsFile() {
  const date = new DateTime(new Date()).toFormat('yyyy-MMMM');
  return path.join(__dirname, `../../data/power-stats-${date}.json`);
}

async function logStatus() {
  try {
    const statsFile = getStatsFile();
    const data = await getStats(statsFile);
    data.push({ time: (new Date()).toISOString(), status: await getStatus() });
    saveStats(data, statsFile);
  } catch (err) {
    console.error(err);
  }
}

async function getStatus() {
  return await isReachable(config.powerMonitor.address);
}

async function getStats(statsFile = getStatsFile()) {
  return (await fs.readJSON(statsFile).catch(()=>{})) || [];
}

async function saveStats(data, statsFile = getStatsFile()) {
  await fs.outputFile(statsFile, JSON.stringify(data, null, '  '));
}

module.exports = { logStatus, getStats, getStatus };
