import React from 'react';

export default function Address(props) {
  const className = [
    'AddressList__Address',
    `AddressList__Address--${props.disabled? 'disabled': 'not-disabled'}`
  ].join(' ')

  return (
    <div className={className} onClick={props.onToggleClick}>
      <div className="AddressList__Address__icon">
        <i className={`icon-${props.icon}`}></i>
      </div>
      <div className="AddressList__Address__label">{props.label || props.address}</div>
    </div>
  );
}
