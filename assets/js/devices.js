import React from 'react';
import useApi from './hooks/use-polling-api';

export default function Devices() {
  const { error, data: devices, loading } = useApi(`/api/devices`);

  const renderError = ()=> (
    <div className="Devices__error">
      { error.message }
    </div>
  );

  const renderLoading = ()=> (
    <div className="Devices__loading">
      Loading...
    </div>
  );

  const renderDevices = ()=> (
    <div className="Devices__devices">
      {devices.map(device => {
        return <Device device={device} key={device.ip}/>
      })}
    </div>
  );

  return (
    <div className="Devices">
      { error ? renderError() : null }
      { loading ? renderLoading() : null }
      { !(error || loading) ? renderDevices() : null }
    </div>
  );
}

function Device(props) {
  return (
    <a className={`Device Device--${props.device.online? 'online': 'offline'}`} href={`http://${props.device.ip}:${props.device.port || 80}`}>
      <div className="Device__icon">
        <i className="icon-network"></i>
      </div>
      <div className="Device__name">{props.device.deviceName}</div>
      <div className="Device__ip">{props.device.ip}</div>
    </a>
  );
}
