import express from 'express';
import * as mikrotik from './utils/mikrotik';
import isReachable from './utils/is-reachable';
import wrapAsync from './utils/wrap-async-middleware';
import devices from './devices';

const router = new express.Router();

router.get('/devices', wrapAsync(async (req, res, next)=> {
  const stats = await Promise.all(devices.map( device => isReachable(device.ip)));
  const deviceList = stats.map( (stat, index)=> {
    return {
      ...devices[index],
      online: stat
    };
  });
  res.apiSuccess(deviceList);
}));

router.get('/connections', wrapAsync(async (req, res, next)=> {
  const allInterfaces = await mikrotik.executeCommandOnRouter('/interface/print');
  const pppoeInterfaces = allInterfaces.filter( iface => iface.name.startsWith('PPPoE'));

  const allRoutes = await mikrotik.executeCommandOnRouter('/ip/route/print');
  const staticPppoeRoutes = allRoutes.filter( route => mikrotik.convertStringToBoolean(route.static) && route.gateway.startsWith('PPPoE'));

  //Preferred route is the one with lowest distance value
  let preferredRoute = staticPppoeRoutes[0];
  for(const route of staticPppoeRoutes) {
    if(Number.parseInt(route.distance, 10) < Number.parseInt(preferredRoute.distance, 10)) {
      preferredRoute = route;
    }
  }

  const connections = pppoeInterfaces.map( iface => {
    const route = staticPppoeRoutes.find( route => route.gateway === iface.name);
    return {
      label: iface.name.split('-')[1], //Interface names look like `PPPoE-ISPName`,
      connectionName: iface.name,
      preferred: preferredRoute.gateway === iface.name,
      running: mikrotik.convertStringToBoolean(iface.running),
      disabled: mikrotik.convertStringToBoolean(iface.disabled),
      active: mikrotik.convertStringToBoolean(route.active)
    };
  });

  res.apiSuccess(connections);
}));

router.post('/connections/prefer/:interfaceName', wrapAsync(async (req, res, next)=> {
  const allInterfaces = await mikrotik.executeCommandOnRouter('/interface/print');
  const pppoeInterfaces = allInterfaces.filter( iface => iface.name.startsWith('PPPoE'));

  //Only PPPoE interfaces can be preferred
  const iface = pppoeInterfaces.find( iface => iface.name === req.params.interfaceName);
  if(!iface) return res.apiFail({ message: 'Invalid Interface Name'});

  const allRoutes = await mikrotik.executeCommandOnRouter('/ip/route/print');
  const staticPppoeRoutes = allRoutes.filter( route => mikrotik.convertStringToBoolean(route.static) && route.gateway.startsWith('PPPoE'));

  //Setting route distance to 2 prefers the route and setting the route distance higher makes the route less preferred
  for(const route of staticPppoeRoutes) {
    //Set the selected interface route distance to 2 all other routes to 3
    const distance = route.gateway === iface.name ? 2: 3;
    await mikrotik.executeCommandOnRouter('/ip/route/set', { '.id': route['.id'], distance });
  }

  res.apiSuccess({ message: `Preferred ${iface.name}`});
}));

router.post('/connections/refresh/:interfaceName', wrapAsync(async (req, res, next)=> {
  const allInterfaces = await mikrotik.executeCommandOnRouter('/interface/print');
  const pppoeInterfaces = allInterfaces.filter( iface => iface.name.startsWith('PPPoE'));

  //Only PPPoE interfaces can be refreshed
  const iface = pppoeInterfaces.find( iface => iface.name === req.params.interfaceName);
  if(!iface) return res.apiFail({ message: 'Invalid Interface Name'});

  //Refresh the interface
  await mikrotik.executeCommandOnRouter('/interface/set', { '.id': iface['.id'], disabled: 'yes' });
  await mikrotik.executeCommandOnRouter('/interface/set', { '.id': iface['.id'], disabled: 'no' });

  res.apiSuccess({ message: `Refreshed ${iface.name}`});
}));

router.get('/throughput/:interfaceName', wrapAsync(async (req, res, next)=> {
  const allInterfaces = await mikrotik.executeCommandOnRouter('/interface/print');
  const iface = allInterfaces.find( iface => iface.name === req.params.interfaceName);
  if(!iface) return res.apiFail({ message: 'Invalid Interface Name'});
  let [ stats ] = await mikrotik.executeCommandOnRouter('/interface/monitor-traffic', { interface: iface.name, once: true });
  res.apiSuccess({
    rxSpeed: Number.parseInt(stats['rx-bits-per-second'], 10),
    txSpeed: Number.parseInt(stats['tx-bits-per-second'], 10)
  });
}));

router.get('/lan-devices', wrapAsync(async (req, res, next)=> {
  const dhcpLeases = await mikrotik.executeCommandOnRouter('/ip/dhcp-server/lease/print');
  const queues = await mikrotik.executeCommandOnRouter('/queue/simple/print');
  const addressList = await mikrotik.getAddressList('Allow-Internet');
  const arpList = await mikrotik.executeCommandOnRouter('/ip/arp/print');

  const devices = dhcpLeases.map( lease => {
    const addressListItem = addressList.find( item => item.address === lease['address']);
    const queueItem = queues.find( item=> item['target'] === `${lease['address']}/32`);
    const arpItem = arpList.find( item=> item['address'] === lease['address']);
    const dataBytes = queueItem? queueItem.bytes: '0/0';
    const [ upload, download ] = dataBytes.split('/').map( byte=> Number.parseInt(byte, 10));
    return {
      hostName: lease['host-name'],
      deviceName: lease['comment'],
      ip: lease['address'],
      mac: lease['mac-address'],
      active: !!arpItem,
      blocked: addressListItem? mikrotik.convertStringToBoolean(addressListItem.disabled): false,
      approved: !!addressListItem, //Internet is approved when the device ip is added to the list
      downloadBytes: download,
      uploadBytes: upload
    };
  });

  res.apiSuccess(devices);
}));

router.post('/lan-devices/approve/:deviceMac', wrapAsync(async (req, res, next)=> {
  const deviceName = String(req.body.deviceName);
  if(!deviceName || !/^[a-zA-Z0-9_'\-\s]*$/.test(deviceName)) return res.apiFail({ message: 'Invalid device name'});

  const deviceMac = req.params.deviceMac.toUpperCase();
  const lease = await mikrotik.getDhcpLeaseForMac(deviceMac);
  if(!lease) return res.apiFail({ message: 'Device not connected to the network'});

  //Check if device has already been approved
  const addressListItem = await mikrotik.getAddressListItem({ list: 'Allow-Internet', address: lease['address'] });
  if(addressListItem) res.apiFail({ message: 'Device already approved'});

  //Add static dhcp entry if the device ip is dynamic
  if(mikrotik.convertStringToBoolean(lease.dynamic)) {
    await mikrotik.executeCommandOnRouter('/ip/dhcp-server/lease/add', {
      'address': lease['address'],
      'always-broadcast': 'yes',
      'comment': deviceName,
      'mac-address': lease['mac-address'],
      'server': lease['server']
    });
  }

  //Add address to `Allow-Internet` list
  await mikrotik.executeCommandOnRouter('/ip/firewall/address-list/add', {
    'address': lease['address'],
    'comment': deviceName,
    'list': 'Allow-Internet'
  });

  //Add data counter queue
  await mikrotik.executeCommandOnRouter('/queue/simple/add', {
    'max-limit': '1G/1G', //Queue rule require a max limit
    'name': deviceName,
    'target': `${lease['address']}/32`
  });

  res.apiSuccess(`${deviceName} Approved`);
}));

router.post('/lan-devices/remove/:deviceMac', wrapAsync(async (req, res, next)=> {
  const deviceMac = req.params.deviceMac.toUpperCase();
  const lease = await mikrotik.getDhcpLeaseForMac(deviceMac);
  if(!lease) return res.apiFail({ message: 'Unknown device'});

  //Remove device from address list
  const addressListItem = await mikrotik.getAddressListItem({ list: 'Allow-Internet', address: lease['address'] });
  if(addressListItem) await mikrotik.executeCommandOnRouter('/ip/firewall/address-list/remove', { '.id': addressListItem['.id'] });

  //Remove device from queues
  const queueItem = await mikrotik.getQueueForAddress(lease['address']);
  if(queueItem) await mikrotik.executeCommandOnRouter('/queue/simple/remove', { '.id': queueItem['.id'] });

  //Remove dhcp lease
  await mikrotik.executeCommandOnRouter('/ip/dhcp-server/lease/remove', { '.id': lease['.id'] });

  res.apiSuccess(`Device Removed`);
}));

router.post('/lan-devices/toggle-internet/:deviceMac', wrapAsync(async (req, res, next)=> {
  const deviceMac = req.params.deviceMac.toUpperCase();
  const lease = await mikrotik.getDhcpLeaseForMac(deviceMac);
  if(!lease) return res.apiFail({ message: 'Unknown device'});

  const result = await mikrotik.toggleAddressListItem({ list: 'Allow-Internet', address: lease['address'] });
  if(!result) return res.apiFail({ message: 'Unknown device'});

  res.apiSuccess({ message: `Toggled Internet Access`});
}));

router.get('/address-list/:list', wrapAsync(async (req, res, next)=> {
  const listName = req.params.list;
  const list = await mikrotik.getAddressList(listName);
  if(!list.length) return res.apiFail({ message: 'Unknown list'});

  //Remove dynamic address and unnecessary details
  let addresses = [];
  for(const address of list) {
    const dynamic = mikrotik.convertStringToBoolean(address.dynamic);
    const disabled = mikrotik.convertStringToBoolean(address.disabled);
    if(dynamic) continue;
    addresses.push({
      disabled,
      address: address.address,
      label: address.comment //Address label is stored in the comment
    });
  }

  res.apiSuccess(addresses);
}));

router.post('/address-list/:list/:address/toggle', wrapAsync(async (req, res, next)=> {
  const list = req.params.list;
  const address = req.params.address;
  const result = mikrotik.toggleAddressListItem({ list, address });
  if(!result) return res.apiFail({ message: 'Invalid address or list'});
  res.apiSuccess({ message: `Toggled address`});
}));

router.get('/ad-blocker/status', wrapAsync(async (req, res, next)=> {
  //Ad blocker is enabled if dns ip is pointing to home server
  const result = await mikrotik.executeCommandOnRouter('/ip/dns/print');
  const enabled = result[0].servers.includes('192.168.1.3');
  res.apiSuccess({ enabled });
}));

router.get('/ad-blocker/toggle', wrapAsync(async (req, res, next)=> {
  const result = await mikrotik.executeCommandOnRouter('/ip/dns/print');
  const enabled = result[0].servers.includes('192.168.1.3');
  const newServer = enabled? '1.1.1.1': '192.168.1.3'; //Point to CloudFlare to disable ad blocking
  await mikrotik.executeCommandOnRouter('/ip/dns/set', { servers: newServer });
  await mikrotik.executeCommandOnRouter('/ip/dns/cache/flush');

  //Toggle net-watch rule to prevent it from reverting dns settings
  const rules = await mikrotik.executeCommandOnRouter('/tool/netwatch/print');
  const rule = rules.find(rule=> rule.comment.includes('Change DNS'));
  await mikrotik.executeCommandOnRouter('/tool/netwatch/set', {
    '.id': rule['.id'],
    disabled: mikrotik.convertBooleanToYesNo(newServer === '1.1.1.1')
  });

  res.apiSuccess({ enabled: !enabled });
}));

export default router;
