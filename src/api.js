const express = require('express');
const mikrotik = require('./mikrotik');
const isReachable = require('./utils/is-reachable');
const wrapAsync = require('./utils/wrap-async-middleware');
const unifi = require('./unifi');
const password = require('./utils/password');
const router = new express.Router();

// Add api methods
router.use((req, res, next)=> {
  res.apiSuccess = (data)=> {
    res.json({ success: true, error: false, data });
  };

  res.apiFail = ({ code = 500, data = {}, message = 'Server Error'} = {})=> {
    res.status(code);
    res.json({ success: false, error: true, data, message });
  };

  next();
});

router.get('/devices', wrapAsync(async (req, res, next)=> {
  const devices = [
    { deviceName: `Router`, ip: `192.168.1.1` },
    { deviceName: `Techminds ONU`, ip: `192.168.100.1` },
    { deviceName: `MCN ONU`, ip: `192.168.100.2` },
    { deviceName: `Subash's Room AP`, ip: `192.168.1.5` },
    { deviceName: `Living Room AP`, ip: `192.168.1.6` },
    { deviceName: `Nishan's AP`, ip: `192.168.2.3` },
    { deviceName: `Nishan's STA`, ip: `192.168.2.4` },
    { deviceName: `Nishan's Router`, ip: `192.168.2.5` }
  ];

  const stats = await Promise.all(devices.map( device => isReachable(device.ip)));
  res.apiSuccess(stats.map((online, index)=> ({ ...devices[index], online })));
}));

router.get('/connections', wrapAsync(async (req, res, next)=> {
  const interfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = interfaces.filter( iface=> iface.type === 'pppoe-out' );

  // Get default route for each PPPoE interface
  const routes = await mikrotik.request('/ip/route/print');
  const pppoeRoutes = pppoeInterfaces.map( iface=> (
    routes.find( route=> (
      route.gateway === iface.name &&
      !route['routing-mark'] &&
      mikrotik.stringToBoolean(route.static)
    ))
  ));

  // Preferred route is the one with lowest distance value
  const isPreferred = route=> (
    Math.min(...pppoeRoutes.map(route=> parseInt(route.distance, 10))) == parseInt(route.distance, 10)
  );

  res.apiSuccess(
    pppoeInterfaces.map((iface, index)=> ({
      interfaceName: iface.name,
      preferred: isPreferred(pppoeRoutes[index]),
      running: mikrotik.stringToBoolean(iface.running),
      disabled: mikrotik.stringToBoolean(iface.disabled),
      active: mikrotik.stringToBoolean(pppoeRoutes[index].active)
    }))
  );
}));

router.post('/connections/prefer/:interfaceName', wrapAsync(async (req, res, next)=> {
  const interfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = interfaces.filter( iface=> iface.type === 'pppoe-out' );
  const iface = pppoeInterfaces.find( iface=> iface.name === req.params.interfaceName);

  //Only PPPoE interfaces can be refreshed
  if(iface.type !== 'pppoe-out') return res.apiFail({ message: 'Only PPPoE interfaces can be preferred'});

  // Get default route for each PPPoE interface
  const routes = await mikrotik.request('/ip/route/print');
  const pppoeRoutes = pppoeInterfaces.map( iface=> (
    routes.find( route=> (
      route.gateway === iface.name &&
      !route['routing-mark'] &&
      mikrotik.stringToBoolean(route.static)
    ))
  ));

  // Setting a shorter route distance makes the route preferred
  for(const route of pppoeRoutes) {
    const distance = route.gateway === iface.name ? 2: 3; // Set the selected interface route distance to 2 all other routes to 3
    await mikrotik.request('/ip/route/set', { '.id': route['.id'], distance });
  }

  res.apiSuccess({ message: `Preferred ${iface.name}`});
}));

router.post('/connections/refresh/:interfaceName', wrapAsync(async (req, res, next)=> {
  const interfaces = await mikrotik.request('/interface/print');
  const iface = interfaces.find( iface=> iface.name === req.params.interfaceName);

  //Only PPPoE interfaces can be refreshed
  if(iface.type !== 'pppoe-out') return res.apiFail({ message: 'Only PPPoE interfaces can be refreshed'});

  //Refresh the interface
  await mikrotik.request('/interface/set', { '.id': iface['.id'], disabled: 'yes' });
  await mikrotik.request('/interface/set', { '.id': iface['.id'], disabled: 'no' });

  res.apiSuccess({ message: `Refreshed ${iface.name}`});
}));

//Return combined speed of all PPPoE interfaces
router.get('/throughput', wrapAsync(async (req, res, next)=> {
  const interfaces = await mikrotik.request('/interface/print');
  const pppoeInterfaces = interfaces.filter( iface=> iface.type === 'pppoe-out' );

  const throughput = await Promise.all(pppoeInterfaces.map( iface=> (
    mikrotik.request('/interface/monitor-traffic', { interface: iface.name, once: true })
  )));

  res.apiSuccess({
    rxSpeed: throughput.reduce((total, result)=> total + parseInt(result[0]['rx-bits-per-second'], 10), 0),
    txSpeed: throughput.reduce((total, result)=> total + parseInt(result[0]['tx-bits-per-second'], 10), 0)
  });
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
  res.apiSuccess({ status: await isReachable(`192.168.1.9`) });
}));

module.exports = router;
