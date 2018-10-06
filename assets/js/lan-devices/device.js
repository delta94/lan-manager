import React, { Component }from 'react';

export default class Device extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isTouching: false,
      showRemove: false
    };
  
    this.onTapStart = this.onTapStart.bind(this);
    this.onTapEnd = this.onTapEnd.bind(this);
  }

  static bytesToString(bytes) {
    let total, unit;
    const GB = 1024 ** 3;
    const MB = 1024 ** 2;
    const KB = 1024;
  
    if(bytes >= GB) {
      total = bytes/GB;
      unit = 'GB';
    } else if(bytes >= MB) {
      total = bytes/MB;
      unit = "MB";
    } else  {
      total = bytes/KB;
      unit = 'KB';
    }
  
    return { total, unit };
  }

  componentWillUnmount() {
    clearTimeout(this.tapTimer);
  }

  onTapStart() {
    this.setState({ isTouching: true });
    this.tapTimer = setTimeout(()=> {
      if(this.state.isTouching) this.setState({ showRemove: !this.state.showRemove });
    }, 3*1000 ); //Show the remove button on click and hold longer than 3 seconds
  }

  onTapEnd() {
    clearTimeout(this.tapTimer);
    this.setState({ isTouching: false });
  }

  render() {
    const props = this.props;
    const device = props.device;
    const dataUsage = Device.bytesToString(props.device.downloadBytes + props.device.uploadBytes);
    const className = [
      `LanDevices__Device`,
      `LanDevices__Device--${device.approved ? 'approved': 'not-approved'}`,
      `LanDevices__Device--${device.active ? 'active': 'not-active'}`,
      `LanDevices__Device--${device.blocked ? 'blocked': 'not-blocked'}`
    ].join(' ');
    
    const dataComponent = (
      <div className="LanDevices__Device__usage">
        <i className="icon-arrow_downward"></i> { dataUsage.total.toFixed(1) } { dataUsage.unit }
      </div>
    );
    
    const macComponent = (
      <div className="LanDevices__Device__mac">
        { device.mac }
      </div>
    );

    const approveButton = (
      <button className="LanDevices__Device__action" onClick={props.onApprove}>Approve</button>
    );

    const blockButton = (
      <button className="LanDevices__Device__action" onClick={props.onToggleInternet}>{device.blocked? 'Unblock': 'Block'}</button>
    );

    const removeButton = (
      <button className="LanDevices__Device__action" onClick={props.onRemove}>Remove</button>
    );
    
    return (
      <div className={className} onMouseDown={this.onTapStart} onMouseUp={this.onTapEnd} onTouchStart={this.onTapStart} onTouchEnd={this.onTapEnd}>
        <div className="LanDevices__Device__icon">
          <i className="icon-wifi"></i>
        </div>
        <div className="LanDevices__Device__name">
          { device.deviceName || device.hostName }
        </div>
        { device.approved? dataComponent: macComponent }
        <div className="LanDevices__Device__actions">
          { device.approved && !this.state.showRemove ? blockButton: null}
          { device.approved && this.state.showRemove ? removeButton: null }
          { !device.approved ? approveButton: null }
        </div>
      </div>
    );
  }
}
