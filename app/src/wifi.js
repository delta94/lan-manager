import React from 'react';
import useApi from './hooks/use-api';

export default function Wifi() {
  const { error, data, loading } = useApi(`/api/guest-wifi`);

  if(error) {
    return (
      <div className="Wifi">
        Failed to load the wifi details
      </div>
    );
  }

  return (
    <div className="Wifi">
      <div className="Wifi__icon">
        <i className="icon-wifi"></i>
      </div>
      <div className="Wifi__name">{loading? `Loading`: data.name }</div>
      <div className="Wifi__password">{loading? `Loading`: data.password}</div>
    </div>
  );
}
