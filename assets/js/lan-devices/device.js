import React, { Component }from 'react';

export default class Device extends Component {
  constructor(props) {
    super(props);
    this.clickCount = 0;
    this.onClick = this.onClick.bind(this);
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

  componentDidMount() {
    this.startClickTimer();
  }

  componentWillUnmount() {
    this.stopClickTimer();
  }

  startClickTimer() {
    this.clickTimer = setInterval(()=> {
      this.clickCount = 0;
    }, 2 * 1000) //Reset click count every 2 seconds
  }

  stopClickTimer() {
    clearInterval(this.clickTimer);
  }

  onClick(e) {
    this.clickCount++;
    e.preventDefault();
    if(this.clickCount === 7) this.props.onRemove(); //Tap 7 times to remove a device
  }

  render() {
    const props = this.props;
    const device = props.device;
    const dataUsage = Device.bytesToString(props.device.downloadBytes + props.device.uploadBytes);
    const className = [
      `LanDevices__Device`,
      `LanDevices__Device--${device.approved ? 'approved': 'not-approved'}`,
      `LanDevices__Device--${device.active ? 'active': 'not-active'}`,
      `LanDevices__Device--${device.blocked ? 'blocked': 'not-blocked'}`,
      `LanDevices__Device--${device.distractionFilterEnabled ? 'distraction-filter-enabled': 'distraction-filter-not-enabled'}`
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
    
    return (
      <div className={className} onClick={this.onClick}>
        <div className="LanDevices__Device__icon">
          <i className="icon-wifi"></i>
        </div>
        <div className="LanDevices__Device__name">
          { device.deviceName || device.hostName }
        </div>
        { device.approved? dataComponent: macComponent }
        <div className="LanDevices__Device__actions">
        { device.approved ? <button className="LanDevices__Device__action LanDevices__Device__action-internet" onClick={props.onToggleInternet}>{device.blocked? 'Unblock': 'Block'}</button>: null }
        { !device.approved ? <button className="LanDevices__Device__action LanDevices__Device__action-approve" title="Approve Device" onClick={props.onApprove}>Approve</button>: null }
        </div>
      </div>
    );
  }
}