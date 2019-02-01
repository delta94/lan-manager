import React, { Component }from 'react';

export default class Device extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isTouching: false,
      showRemove: false,
      info: 'usage'
    };

    this.onTapStart = this.onTapStart.bind(this);
    this.onTapEnd = this.onTapEnd.bind(this);
    this.onInfoClick = this.onInfoClick.bind(this);
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
    }, 1000 ); //Show the remove button on click and hold longer than a second
  }

  onTapEnd() {
    clearTimeout(this.tapTimer);
    this.setState({ isTouching: false });
  }

  onInfoClick() {
    const views = ['usage', 'ip', 'mac'];
    const currentIndex = views.indexOf(this.state.info);
    const nextView = views[currentIndex + 1] || views[0];
    this.setState({ info:  nextView });
  }

  renderInfo() {
    const props = this.props;
    const state = this.state;
    if(state.info === 'mac' || !props.device.approved) {
      return (
        <div className="LanDevices__Device__mac" onClick={this.onInfoClick}>
          { props.device.mac }
        </div>
      );
    } else if(state.info === 'usage') {
      const dataUsage = Device.bytesToString(props.device.downloadBytes + props.device.uploadBytes);
      return (
        <div className="LanDevices__Device__usage" onClick={this.onInfoClick}>
          <i className="icon-arrow_downward"></i> { dataUsage.total.toFixed(1) } { dataUsage.unit }
        </div>
      );
    } else if(state.info === 'ip'){
      return (
        <div className="LanDevices__Device__ip" onClick={this.onInfoClick}>
          { props.device.ip }
        </div>
      );
    }
  }

  renderActions() {
    const props = this.props;
    const state = this.state;
    const device = this.props.device;
    if(!device.approved) {
      return (
        <button className="LanDevices__Device__action" onClick={props.onApprove}>Approve</button>
      );
    } else if(state.showRemove) {
      return (
        <button className="LanDevices__Device__action" onClick={props.onRemove}>Remove</button>
      );
    } else {
      return (
        <button className="LanDevices__Device__action" onClick={props.onToggleInternet}>{device.blocked? 'Unblock': 'Block'}</button>
      );
    }
  }

  render() {
    const props = this.props;
    const device = props.device;
    const className = [
      `LanDevices__Device`,
      `LanDevices__Device--${device.approved ? 'approved': 'not-approved'}`,
      `LanDevices__Device--${device.active ? 'active': 'not-active'}`,
      `LanDevices__Device--${device.blocked ? 'blocked': 'not-blocked'}`
    ].join(' ');

    return (
      <div className={className} onMouseDown={this.onTapStart} onMouseUp={this.onTapEnd} onTouchStart={this.onTapStart} onTouchEnd={this.onTapEnd}>
        <div className="LanDevices__Device__icon">
          <i className="icon-wifi"></i>
        </div>
        <div className="LanDevices__Device__name">
          { device.deviceName || device.hostName }
        </div>
        { this.renderInfo() }
        <div className="LanDevices__Device__actions">
          { this.renderActions() }
        </div>
      </div>
    );
  }
}
