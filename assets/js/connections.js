import React from 'react';

export default function Connections() {
  return (
    <div className="Connections">
      <Connection label="ABCD" running={true} disabled={false} active={true} preferred={true} />
      <Connection label="ABCD" running={true} disabled={false} active={false} preferred={false} />
    </div>
  );
}

function Connection({ label, running, disabled, active, preferred }) {
  const className = [
    `Connection`,
    `Connection--${running ? 'running': 'not-running'}`,
    `Connection--${disabled ? 'disabled': 'not-disabled'}`,
    `Connection--${active ? 'active': 'not-active'}`,
    `Connection--${preferred ? 'preferred': 'not-preferred'}`
  ].join(' ');

  const renderPreferredIcon = ()=> (
    <div className="Connection__preferred-icon" title="Preferred Connection">
      <i className="icon-favorite"></i>
    </div>
  );

  return (
    <a className={className}>
      { preferred ? renderPreferredIcon() : null }
      <div className="Connection__label">{label}</div>
      <div className="Connection__actions">
        <button className="Connection__action" title="Refresh Connection"><i className="icon-refresh"></i> Refresh</button>
        <button className="Connection__action" title="Prefer Connection"><i className="icon-refresh"></i> Prefer</button>
      </div>
    </a>
  );
}
