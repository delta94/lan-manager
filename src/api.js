const express = require('express');
const sortBy = require('lodash.sortby');
const mikrotik = require('./utils/mikrotik');
const isReachable = require('./utils/is-reachable');
const wrapAsync = require('./utils/wrap-async-middleware');
const devices = require('./devices');
const unifi = require('./utils/unifi');
const powerMonitor = require('./utils/power-monitor');
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

router.get('/arp', wrapAsync(async (req, res, next)=> {
  let devices = await mikrotik.request('/ip/arp/print');
  devices = devices.filter( device=> mikrotik.stringToBoolean(device.complete)); //Only list complete arp entries
  const stats = await Promise.all(devices.map( device => isReachable(device.address)));
  const list = devices.map( (device, index)=> {
    return {
      address: device.address,
      mac: device['mac-address'],
      lan: device.address.startsWith('192.168'),
      active: stats[index]
    };
  });
  res.apiSuccess(sortBy(list, 'address'));
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

router.get('/power-status', wrapAsync(async (req, res, next)=> {
  res.apiSuccess({ status: await powerMonitor.getStatus() });
}));

router.get('/power-stats', wrapAsync(async (req, res, next)=> {
  res.apiSuccess(await powerMonitor.getStats());
}));

module.exports = router;
