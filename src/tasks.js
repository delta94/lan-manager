const { logStatus } = require('./utils/power-monitor');

exports.init = function init() {
  setInterval(logStatus, 60 * 1000); //Monitor electricity every minute
}
