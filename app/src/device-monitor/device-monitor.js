import React, { Component } from 'react';
import Device from './device';
import useApi from '../hooks/use-polling-api';

export default function DeviceMonitor() {
  const { error, data: devices, loading } = useApi(`/api/devices`);

  if(error) {
    return (
      <div className="DeviceMonitor">
        { error.message }
      </div>
    );
  }

  if(loading) {
    return (
      <div className="DeviceMonitor">
       Loading...
      </div>
    );
  }

  return (
    <div className="DeviceMonitor">
    {devices.map(device => {
      return <Device device={device} key={device.ip}/>
    })}
    </div>
  );
}
