const Mikronode = require('mikronode');
const uuid = require('uuid');
const config = require('../../config.js');
let mikrotikConnection;

async function getConnection() {
  if(mikrotikConnection) return mikrotikConnection;
  const device = new Mikronode(config.router.address);
  const [ login ] = await device.connect();
  mikrotikConnection = await login(config.router.username, config.router.password);
  mikrotikConnection.closeOnDone(true);
  mikrotikConnection.on('close', ()=> { mikrotikConnection = null; });
  return mikrotikConnection;
}

async function getChannel(name) {
  const connection = await getConnection();
  if(!name) name = uuid.v4();
  const channel = connection.openChannel(name);
  channel.closeOnDone(true);
  return channel;
}

async function requestRouter(command, data) {
  const channel = await getChannel();
  return new Promise((resolve, reject)=> {
    channel.write(command, data);
    channel.on('done', ({ data })=> {
      resolve(data.map( item=> Mikronode.resultsToObj(item)));
    });
  });
}

function booleanToString(value) {
  return value ? 'yes': 'no';
}

function stringToBoolean(value) {
  return value === 'true' || value === 'yes';
}

module.exports = {
  request: requestRouter,
  booleanToString,
  stringToBoolean
};
