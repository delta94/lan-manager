import React from 'react';
import useApi from './hooks/use-polling-api';

export default function Throughput() {
  const { error, data, loading } = useApi(`/api/power-status`);

  return (
    <div className="Throughput">
      <Speed bytes={1000000} icon='arrow_upward' />
      <Speed bytes={1000000} icon='arrow_downward' />
    </div>
  );
}

function round(number, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function Speed({ bytes, icon }) {
  let speed = round(bytes / (1024 * 1024), 2);
  return (
    <div className="Speed">
      <div className="Speed__bytes"><i className={`icon-${icon}`} /> {speed}</div>
      <div className="Speed__unit">Mbps</div>
    </div>
  );
}
