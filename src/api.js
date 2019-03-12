const express = require('express');
const mikrotik = require('./utils/mikrotik');
const isReachable = require('./utils/is-reachable');
const wrapAsync = require('./utils/wrap-async-middleware');
const devices = require('./devices');
const unifi = require('./utils/unifi');
const password = require('./utils/password');
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
  const allInterfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = allInterfaces.filter( iface => iface.name.startsWith('PPPoE'));

  const allRoutes = await mikrotik.request('/ip/route/print');
  const staticPppoeRoutes = allRoutes.filter( route => mikrotik.stringToBoolean(route.static) && route.gateway.startsWith('PPPoE'));

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
      running: mikrotik.stringToBoolean(iface.running),
      disabled: mikrotik.stringToBoolean(iface.disabled),
      active: mikrotik.stringToBoolean(route.active)
    };
  });

  res.apiSuccess(connections);
}));

router.post('/connections/prefer/:interfaceName', wrapAsync(async (req, res, next)=> {
  const allInterfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = allInterfaces.filter( iface => iface.name.startsWith('PPPoE'));

  //Only PPPoE interfaces can be preferred
  const iface = pppoeInterfaces.find( iface => iface.name === req.params.interfaceName);
  if(!iface) return res.apiFail({ message: 'Invalid Interface Name'});

  const allRoutes = await mikrotik.request('/ip/route/print');
  const staticPppoeRoutes = allRoutes.filter( route => mikrotik.stringToBoolean(route.static) && route.gateway.startsWith('PPPoE'));

  //Setting route distance to 2 prefers the route and setting the route distance higher makes the route less preferred
  for(const route of staticPppoeRoutes) {
    //Set the selected interface route distance to 2 all other routes to 3
    const distance = route.gateway === iface.name ? 2: 3;
    await mikrotik.request('/ip/route/set', { '.id': route['.id'], distance });
  }

  res.apiSuccess({ message: `Preferred ${iface.name}`});
}));

router.post('/connections/refresh/:interfaceName', wrapAsync(async (req, res, next)=> {
  const allInterfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = allInterfaces.filter( iface => iface.name.startsWith('PPPoE'));

  //Only PPPoE interfaces can be refreshed
  const iface = pppoeInterfaces.find( iface => iface.name === req.params.interfaceName);
  if(!iface) return res.apiFail({ message: 'Invalid Interface Name'});

  //Refresh the interface
  await mikrotik.request('/interface/set', { '.id': iface['.id'], disabled: 'yes' });
  await mikrotik.request('/interface/set', { '.id': iface['.id'], disabled: 'no' });

  res.apiSuccess({ message: `Refreshed ${iface.name}`});
}));

//Return combined speed of all ISP interfaces
router.get('/throughput', wrapAsync(async (req, res, next)=> {
  const allInterfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = allInterfaces.filter( iface => iface.name.startsWith('PPPoE'));
  let rxSpeed = 0, txSpeed = 0;

  for(const iface of pppoeInterfaces) {
    let [ stats ] = await mikrotik.request('/interface/monitor-traffic', { interface: iface.name, once: true });
    rxSpeed = rxSpeed + Number.parseInt(stats['rx-bits-per-second'], 10);
    txSpeed = txSpeed + Number.parseInt(stats['tx-bits-per-second'], 10);
  }

  res.apiSuccess({ rxSpeed, txSpeed });
}));

router.get('/throughput/:interfaceName', wrapAsync(async (req, res, next)=> {
  const allInterfaces = await mikrotik.request('/interface/print');
  const iface = allInterfaces.find( iface => iface.name === req.params.interfaceName);
  if(!iface) return res.apiFail({ message: 'Invalid Interface Name'});
  let [ stats ] = await mikrotik.request('/interface/monitor-traffic', { interface: iface.name, once: true });
  res.apiSuccess({
    rxSpeed: Number.parseInt(stats['rx-bits-per-second'], 10),
    txSpeed: Number.parseInt(stats['tx-bits-per-second'], 10)
  });
}));

router.get('/address-list/:list', wrapAsync(async (req, res, next)=> {
  const listName = req.params.list;
  const list = await mikrotik.getAddressList(listName);
  if(!list.length) return res.apiFail({ message: 'Unknown list'});

  //Remove dynamic addresses
  const addresses = list.filter(item=> !mikrotik.stringToBoolean(item.dynamic));

  //Respond with status address and label
  res.apiSuccess(addresses.map(address=> {
    return {
      disabled: mikrotik.stringToBoolean(address.disabled),
      address: address.address,
      label: address.comment //Address label is stored in the comment
    }
  }));
}));

router.post('/address-list/:list/:address/toggle', wrapAsync(async (req, res, next)=> {
  const list = req.params.list;
  const address = req.params.address;
  const result = mikrotik.toggleAddressListItem({ list, address });
  if(!result) return res.apiFail({ message: 'Invalid address or list'});
  res.apiSuccess({ message: `Toggled address`});
}));

router.get('/guest-wifi', wrapAsync(async (req, res, next)=> {
  const wifis = await unifi.request('/rest/wlanconf');
  const wifi = wifis.find(wifi=> wifi.is_guest);
  if(!wifi || !wifi.enabled) res.apiFail({ message: 'Guest network disabled' });
  res.apiSuccess({ name: wifi.name, password: wifi.x_passphrase });
}));

router.post('/guest-wifi/reset-password', wrapAsync(async (req, res, next)=> {
  const wifis = await unifi.request('/rest/wlanconf');
  const wifi = wifis.find(wifi=> wifi.is_guest);
  if(!wifi || !wifi.enabled) res.apiFail({ message: 'Guest network disabled' });
  const pw = password.generate();
  await unifi.request(`/rest/wlanconf/${wifi._id}`, {
    method: 'PUT', body: { x_passphrase: pw }
  });
  res.apiSuccess({ name: wifi.name, password: pw });
}));

module.exports = router;
