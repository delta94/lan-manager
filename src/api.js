const express = require('express');
const isIp = require('is-ip');
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
  const interfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = interfaces.filter( iface => iface.name.startsWith('PPPoE'));

  //Get routes with `Default` label; Don't use route.gateway because same gateway interface can be shared by other routes
  const routes = await mikrotik.request('/ip/route/print');
  const defaultRoutes = routes.filter( route=> route.comment && route.comment.startsWith('Default'));

  //Preferred route is the one with lowest distance value
  let preferredRoute = defaultRoutes[0];
  for(const route of defaultRoutes) {
    if(Number.parseInt(route.distance, 10) < Number.parseInt(preferredRoute.distance, 10)) {
      preferredRoute = route;
    }
  }

  const connections = pppoeInterfaces.map( iface => {
    const route = defaultRoutes.find( route => route.gateway === iface.name);
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
  const interfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = interfaces.filter( iface => iface.name.startsWith('PPPoE'));

  //Only PPPoE interfaces can be preferred
  const iface = pppoeInterfaces.find( iface => iface.name === req.params.interfaceName);
  if(!iface) return res.apiFail({ message: 'Invalid Interface Name'});

  //Get routes with `Default` label; Don't use route.gateway because same gateway interface can be shared by other routes
  const routes = await mikrotik.request('/ip/route/print');
  const defaultRoutes = routes.filter( route=> route.comment && route.comment.startsWith('Default'));

  //Setting route distance to 2 prefers the route and setting the route distance higher makes the route less preferred
  for(const route of defaultRoutes) {
    const distance = route.gateway === iface.name ? 2: 3; //Set the selected interface route distance to 2 all other routes to 3
    await mikrotik.request('/ip/route/set', { '.id': route['.id'], distance });
  }

  res.apiSuccess({ message: `Preferred ${iface.name}`});
}));

router.post('/connections/refresh/:interfaceName', wrapAsync(async (req, res, next)=> {
  const interfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = interfaces.filter( iface => iface.name.startsWith('PPPoE'));

  //Only PPPoE interfaces can be refreshed
  const iface = pppoeInterfaces.find( iface => iface.name === req.params.interfaceName);
  if(!iface) return res.apiFail({ message: 'Invalid Interface Name'});

  //Refresh the interface
  await mikrotik.request('/interface/set', { '.id': iface['.id'], disabled: 'yes' });
  await mikrotik.request('/interface/set', { '.id': iface['.id'], disabled: 'no' });

  res.apiSuccess({ message: `Refreshed ${iface.name}`});
}));

//Return combined speed of all PPPoE interfaces
router.get('/throughput', wrapAsync(async (req, res, next)=> {
  const interfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = interfaces.filter( iface => iface.name.startsWith('PPPoE'));
  let rxSpeed = 0, txSpeed = 0;

  for(const iface of pppoeInterfaces) {
    let [ stats ] = await mikrotik.request('/interface/monitor-traffic', { interface: iface.name, once: true });
    rxSpeed = rxSpeed + Number.parseInt(stats['rx-bits-per-second'], 10);
    txSpeed = txSpeed + Number.parseInt(stats['tx-bits-per-second'], 10);
  }

  res.apiSuccess({ rxSpeed, txSpeed });
}));

//Only allow management of certain lists
router.use('/address-list/:list', wrapAsync(async (req, res, next)=> {
  const allowedLists = ['Via-DigitalOcean', 'Via-MCN', 'Via-Techminds', 'Filter-Distractions'];
  if(!allowedLists.includes(req.params.list)) return res.apiFail({ message: 'Invalid address list'});
  let addresses = await mikrotik.request('/ip/firewall/address-list/print');
  addresses = addresses.filter(address=> !mikrotik.stringToBoolean(address.dynamic)); //Remove dynamic addresses
  addresses = addresses.filter(address=> address.list.toLowerCase() === req.params.list.toLowerCase());
  req.addressList = addresses;
  next();
}));

router.get('/address-list/:list', wrapAsync(async (req, res, next)=> {
  res.apiSuccess(req.addressList.map(address=> {
    return {
      address: address.address,
      list: address.list,
      disabled: mikrotik.stringToBoolean(address.disabled)
    };
  }));
}));

router.post('/address-list/:list/add', wrapAsync(async (req, res, next)=> {
  if(!isIp.v4(req.body.address)) return res.apiFail({ message: 'Invalid address'});
  const address = req.addressList.find(address=> address.address === req.body.address);
  if(address) return res.apiFail({ message: 'Address already exists in the list'});
  await mikrotik.request('/ip/firewall/address-list/add', { address: req.body.address, list: req.params.list });
  res.apiSuccess({ message: `Added ${req.body.address}` });
}));

router.post('/address-list/:list/remove', wrapAsync(async (req, res, next)=> {
  if(!isIp.v4(req.body.address)) return res.apiFail({ message: 'Invalid address'});
  const address = req.addressList.find(address=> address.address === req.body.address);
  if(!address) return res.apiFail({ message: 'Address does not exist in the list'});
  await mikrotik.request('/ip/firewall/address-list/remove', { '.id': address['.id'] });
  res.apiSuccess({ message: `Removed ${req.body.address}` });
}));

router.post('/address-list/:list/toggle', wrapAsync(async (req, res, next)=> {
  if(!isIp.v4(req.body.address)) return res.apiFail({ message: 'Invalid address'});
  const address = req.addressList.find(address=> address.address === req.body.address);
  if(!address) return res.apiFail({ message: 'Address does not exist in the list'});
  const currentStatus = mikrotik.stringToBoolean(address.disabled);
  await mikrotik.request('/ip/firewall/address-list/set', { '.id': address['.id'], disabled: mikrotik.booleanToString(!currentStatus) });
  res.apiSuccess({ message: `Toggled ${req.body.address}` });
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
