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

async function executeCommandOnRouter(command, data) {
  const channel = await getChannel();
  return new Promise((resolve, reject)=> {
    channel.write(command, data);
    channel.on('done', ({ data })=> {
      resolve(data.map( item=> Mikronode.resultsToObj(item)));
    });
  });
}

function convertBooleanToYesNo(value) {
  return value ? 'yes': 'no';
}

function convertStringToBoolean(value) {
  return value === 'true' || value === 'yes';
}

async function getDhcpLeaseForMac(deviceMac) {
  const dhcpLeases = await executeCommandOnRouter('/ip/dhcp-server/lease/print');
  return dhcpLeases.find( lease => lease['mac-address'] === deviceMac);
}

async function getAddressList(list) {
  const addressList = await executeCommandOnRouter('/ip/firewall/address-list/print');
  return addressList.filter( item=> item.list === list);
}

async function getAddressListItem({ list, address }) {
  const addressList = await getAddressList(list);
  return addressList.find( item => item.address === address);
}

async function toggleAddressListItem({ list, address }) {
  const addressListItem = await getAddressListItem({ list, address });
  if(!addressListItem) return;
  const currentStatus = convertStringToBoolean(addressListItem.disabled);
  await executeCommandOnRouter('/ip/firewall/address-list/set', { '.id': addressListItem['.id'], disabled: convertBooleanToYesNo(!currentStatus) });
  return await getAddressListItem({ list, address });
}

async function getQueueForAddress(address) {
  const queues = await executeCommandOnRouter('/queue/simple/print');
  return queues.find( item=> item['target'] === `${address}/32`);
}

module.exports = {
  getConnection,
  getChannel,
  executeCommandOnRouter,
  convertBooleanToYesNo,
  convertStringToBoolean,
  getDhcpLeaseForMac,
  getAddressList,
  getAddressListItem,
  toggleAddressListItem,
  getQueueForAddress
};
