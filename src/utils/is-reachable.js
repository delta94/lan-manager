const { exec } = require('child_process');

module.exports = function isReachable(host) {
  return new Promise((resolve, reject) => {
    //Internal function no sanitation required
    exec(`ping -c 1 "${host}"`, { timeout: 300 }, err=> resolve(!err));
  });
}
