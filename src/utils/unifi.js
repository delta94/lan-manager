const rp = require('request-promise-native');
const config = require('../../config.js');

const request = rp.defaults({
  jar: true,
  simple: false,
  json: true,
  baseUrl: config.unifi.address,
});

async function isLoggedIn() {
  const res = await request('/api/self/sites');
  return res.meta.rc === 'ok';
}

async function login() {
  const { username, password } = config.unifi;
  const res = await request.post('/api/login', { body: { username, password }});
  if(res.meta.rc === 'ok') return;
  throw new Error('Login Failed');
}

async function loginIfRequired() {
  if(!(await isLoggedIn())) await login();
}

async function requestSite(path, options) {
  await loginIfRequired();
  const res = await request(`/api/s/${config.unifi.site}${path}`, options);
  if(res.meta.rc !== 'ok') throw new Error(res.meta.msg);
  return res.data;
}

module.exports = {
  request: requestSite
}
