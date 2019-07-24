import React from 'react';
import useApi from './hooks/use-polling-api';

export default function Throughput() {
  const { error, data, loading } = useApi(`/api/throughput`, 1000); // Poll every second

  const renderError = ()=> (
    <div className="Throughput__error">
      { error.message }
    </div>
  );

  const renderLoading = ()=> (
    <div className="Throughput__loading">
      Loading...
    </div>
  );

  const renderSpeed = ()=> (
    <div className="Throughput__inner">
      <Speed bytes={data.rxSpeed} icon='arrow_downward' />
      <Speed bytes={data.txSpeed} icon='arrow_upward' />
    </div>
  );

  return (
    <div className="Throughput">
      { error ? renderError() : null }
      { loading ? renderLoading() : null }
      { !(error || loading) ? renderSpeed() : null }
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
