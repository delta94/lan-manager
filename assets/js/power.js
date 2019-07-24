import React from 'react';
import useApi from './hooks/use-polling-api';

export default function Power() {
  const { error, data, loading } = useApi(`/api/power-status`);

  if(error || loading) {
    return (
      <div className="Power">...</div>
    );
  }

  return (
    <div className={`Power Power--${data.status? 'up': 'down'}`}>
      <div className="Power__icon">
        <i className="icon-bolt"></i>
      </div>
      <div className="Power__status">Power supply is {data.status? 'up': 'down'}</div>
    </div>
  );
}
