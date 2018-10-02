import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import "regenerator-runtime/runtime";
import DeviceMonitor from './device-monitor/device-monitor';
import Speed from './speed'
import Connections from './connections/connections';
import LanDevices from './lan-devices/lan-devices';
import AddressList from './address-list/address-list';
import "../scss/style.scss";

class App extends Component {

  constructor(props) {
    super(props);
  }

  renderDeviceView() {
    return (
      <div className="main-view__section main-view__section--devices">
        <h2 className="main-view__title">Device Monitor</h2>
        <div className="main-view__section-content">
          <DeviceMonitor />
        </div>
      </div>
    );
  }

  renderVPNView() {
    return (
      <div className="main-view__section main-view__section--vpn">
        <h2 className="main-view__title">VPN</h2>
        <div className="main-view__section-content">
          <AddressList list="VPN" icon="shield"/>
        </div>
      </div>
    );
  }

  renderDistractionFilterView() {
    return (
      <div className="main-view__section main-view__section--distraction-filter">
        <h2 className="main-view__title">Distraction Filter</h2>
        <div className="main-view__section-content">
          <AddressList list="Block-Distractions" icon="bullhorn"/>
        </div>
      </div>
    );
  }

  renderConnectionView() {
    return (
      <div className="main-view__section main-view__section--connections">
        <h2 className="main-view__title">Connections</h2>
        <div className="main-view__section-content">
          <Connections />
        </div>
      </div>
    );
  }

  renderSpeedView() {
    return (
      <div className="main-view__section main-view__section--throughput">
        <h2 className="main-view__title">Throughput</h2>
        <div className="main-view__section-content">
          <Speed />
        </div>
      </div>
    );
  }

  renderLanDevicesView() {
    return (
      <div className="main-view__section main-view__section--lan-devices">   
        <h2 className="main-view__title">Connected Devices</h2>
        <div className="main-view__section-content">
          <LanDevices />
        </div>
      </div>
    );
  }

  renderHeader() {
    return (
      <div className="header">
        <h2 className="header__title">LAN Manager</h2>
      </div>
    )
  }
 
  render() {
    return (
      <div>
        { this.renderHeader() }
        <div className="main-view">
          { this.renderConnectionView() }
          { this.renderSpeedView() }
          { this.renderVPNView() }
          { this.renderDistractionFilterView() }
          { this.renderLanDevicesView() }
          { this.renderDeviceView() }
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App/>, document.getElementById('app'));
