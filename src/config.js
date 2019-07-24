function loadFromEnv(key) {
  if(typeof process.env[key] !== 'undefined') {
    return process.env[key];
  }
  throw new Error(`process.env doesn't have the key ${key}`);
}

module.exports = {
  router: {
    address: loadFromEnv('ROUTER_ADDRESS'),
    username: loadFromEnv('ROUTER_USERNAME'),
    password: loadFromEnv('ROUTER_PASSWORD')
  },
  unifi: {
    address: loadFromEnv('UNIFI_ADDRESS'),
    username: loadFromEnv('UNIFI_USERNAME'),
    password: loadFromEnv('UNIFI_PASSWORD')
  }
}
