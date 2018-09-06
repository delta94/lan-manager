import Mikronode from 'mikronode';
import uuid from 'uuid';

function throwError(message) { throw new Error(message); }

const ROUTER_IP = '192.168.1.1';
const ROUTER_USERNAME = process.env.ROUTER_USERNAME || throwError('Please set ROUTER_USERNAME Environment Variable');
const ROUTER_PASSWORD = process.env.ROUTER_PASSWORD || throwError('Please set ROUTER_PASSWORD Environment Variable');
let mikrotikConnection;

export async function getConnection() {
  if(mikrotikConnection) return mikrotikConnection;
  const device = new Mikronode(ROUTER_IP);
  const [ login ] = await device.connect();
  mikrotikConnection = await login(ROUTER_USERNAME, ROUTER_PASSWORD);
  mikrotikConnection.closeOnDone(true);
  mikrotikConnection.on('close', ()=> { mikrotikConnection = null; });
  return mikrotikConnection;
}

export async function getChannel(name) {
  const connection = await getConnection();
  if(!name) name = uuid.v4();
  const channel = connection.openChannel(name);  
  channel.closeOnDone(true);
  return channel;
}

export async function executeCommandOnRouter(command, data) {
  const channel = await getChannel();  
  return new Promise((resolve, reject)=> {
    channel.write(command, data);
    channel.on('done', ({ data })=> {
      resolve(data.map( item=> Mikronode.resultsToObj(item)));
    });
  });
}

export function convertBooleanToYesNo(value) {
  return value ? 'yes': 'no';
}

export function convertStringToBoolean(value) {
  return value === 'true' || value === 'yes';
}

export async function getDhcpLeaseForMac(deviceMac) {
  const dhcpLeases = await executeCommandOnRouter('/ip/dhcp-server/lease/print');
  return dhcpLeases.find( lease => lease['mac-address'] === deviceMac);
}

export async function getAddressList(list) {
  const addressList = await executeCommandOnRouter('/ip/firewall/address-list/print');
  return addressList.filter( item=> item.list === list);
}

export async function getAddressListItem({ list, address }) {
  const addressList = await getAddressList(list);
  return addressList.find( item => item.address === address);
}

export async function getQueueForAddress(address) {
  const queues = await executeCommandOnRouter('/queue/simple/print');
  return queues.find( item=> item['target'] === `${address}/32`);
}