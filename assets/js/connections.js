import React, { useState, useReducer, useEffect } from 'react';
const delay = (timeout)=> new Promise((resolve)=> setTimeout(resolve, timeout));

const initialState = {
  loading: true,
  error: null,
  connections: []
};

async function load() {
  const response = await fetch("/api/connections");
  const json = await response.json();
  if(!json.error) return json.data;
  let err = new Error(json.message);
  err.data = json.data;
  throw err;
}

async function refresh(connectionName) {
  const response = await fetch(`/api/connections/refresh/${connectionName}`, { method: 'post' });
  const json = await response.json();
  if(!json.error) return;
  let err = new Error(json.message);
  err.data = json.data;
  throw err;
}

async function prefer(connectionName) {
  const response = await fetch(`/api/connections/prefer/${connectionName}`, { method: 'post' });
  const json = await response.json();
  await delay(1000); // Give a second for the router to switch connections
  if(!json.error) return;
  let err = new Error(json.message);
  err.data = json.data;
  throw err;
}

function swallowError(promise) {
  promise.catch((err)=> console.error(err));
}

function reducer(state, action) {
  switch(action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'ERROR':
      return { ...state, loading: false, error: action.error };
    case 'LOAD':
      return { loading: false, error: null, connections: action.connections };
    case 'PREFER':
      state.connections.forEach(c=> c.preferred = false); // Remove preferred from other connections
      state.connections.forEach(c=> c.active = false); // Remove active from other connections
      action.connection.preferred = true;
      action.connection.active = true;
      return { ...state };
    default:
      throw new Error(`Invalid action ${action.type}`);
  }
}

export default function Connections() {
  const [ state, dispatch ] = useReducer(reducer, initialState);
  const [ pollData, setPollData ] = useState(true);
  const { error, loading, connections } = state;

  // Load on mount
  useEffect(()=> {
    load()
      .then(connections=> dispatch({ type: 'LOAD', connections }))
      .catch((err)=> {
        dispatch({ type: 'LOADING', loading: false });
        dispatch({ type: 'ERROR', error: err });
      });
  }, []);

  // Reload data every 3 seconds
  useEffect(()=> {
    if(!pollData) return;
    const interval = setInterval(()=> swallowError(
      load().then(connections=> dispatch({ type: 'LOAD', connections }))
    ), 3 * 1000);
    return ()=> clearInterval(interval);
  }, [pollData]);

  const renderError = ()=> (
    <div className="Connections__error">
      { error.message }
    </div>
  );

  const renderLoading = ()=> (
    <div className="Connections__loading">
      Loading...
    </div>
  );

  const renderConnections = ()=> (
    connections.map(connection => (
      <Connection
        key={connection.connectionName}
        label={connection.label}
        running={connection.running}
        disabled={connection.disabled}
        active={connection.active}
        preferred={connection.preferred}
        onRefresh={()=> swallowError(refresh(connection.connectionName))}
        onPrefer={()=> {
          setPollData(false); // Give some time for the router to switch connections
          dispatch({ type: 'PREFER', connection });
          swallowError(
            prefer(connection.connectionName).finally(()=> setPollData(true)) // Restart polling
          );
        }}
      />
    ))
  );

  return (
    <div className="Connections">
      { error ? renderError() : null }
      { loading ? renderLoading() : null }
      { !(error || loading) ? renderConnections() : null }
    </div>
  );
}

function Connection({ label, running, disabled, active, preferred, onRefresh, onPrefer }) {
  const className = [
    `Connection`,
    `Connection--${running ? 'running': 'not-running'}`,
    `Connection--${disabled ? 'disabled': 'not-disabled'}`,
    `Connection--${active ? 'active': 'not-active'}`,
    `Connection--${preferred ? 'preferred': 'not-preferred'}`
  ].join(' ');

  const refreshButton = ()=> (
    <button className="Connection__action" title="Refresh Connection" onClick={onRefresh}>
      <i className="icon-refresh"></i> Refresh
    </button>
  );

  const preferButton = ()=> (
    <button className="Connection__action" title="Refresh Connection" onClick={onPrefer}>
      <i className="icon-favorite"></i> Prefer
    </button>
  );

  return (
    <a className={className}>
      <div className="Connection__label">{label}</div>
      <div className="Connection__actions">
        { refreshButton() }
        { !preferred ? preferButton() : null }
      </div>
    </a>
  );
}
