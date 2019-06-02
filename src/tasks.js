const { logStatus } = require('./utils/power-monitor');

exports.init = function init() {
  setInterval(logStatus, 15 * 1000); //Monitor electricity every 15 seconds
}
