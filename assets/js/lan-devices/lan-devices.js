import React, { Component } from 'react';
import Device from './device';

export default class LanDevices extends Component {

  constructor(props) {
    super(props);
    this.state = {
      devices: [],
      showInactive: false
    };
  }

  componentWillMount() {
    this.loadDevices();
  }

  componentDidMount() {
    this.startDeviceMonitor();
  }

  componentWillUnmount() {
    this.stopDeviceMonitor();
  }

  startDeviceMonitor() {
    this.deviceTimer = setInterval(async ()=> {
      this.loadDevices();
    }, 3000);
  }

  stopDeviceMonitor() {
    clearInterval(this.deviceTimer);
  }

  async onApprove(device) {
    const { mac } = device;
    const deviceName = prompt('Enter a name for the device', device.deviceName || device.hostName);
    if(!deviceName) return;
    
    const data = new URLSearchParams();
    data.set('deviceName', deviceName);

    const response = await fetch(`/api/lan-devices/approve/${mac}`, { method: 'post', body: data });
    const json = await response.json();
    
    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }

    await this.loadDevices();
  }

  async onDisapprove(device) {
    const { mac } = device;
    const response = await fetch(`/api/lan-devices/disapprove/${mac}`, { method: 'post' });
    const json = await response.json();
    
    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }

    await this.loadDevices();
  }

  async onToggleInternet(device) {
    const { mac } = device;
    const response = await fetch(`/api/lan-devices/toggle-internet/${mac}`, { method: 'post' });
    const json = await response.json();
    
    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }

    await this.loadDevices();
  }

  async onToggleDistractionFilter(device) {
    const { mac } = device;
    const response = await fetch(`/api/lan-devices/toggle-distraction-filter/${mac}`, { method: 'post' });
    const json = await response.json();
    
    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }

    await this.loadDevices();
  }

  async loadDevices() {
    const response = await fetch("/api/lan-devices");
    const json = await response.json();
    
    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }

    this.state.devices = json.data;
    this.setState(this.state);
  }

  async toggleInactive() {
    this.state.showInactive = !this.state.showInactive;
    this.setState(this.state);
  }

  render() {
    return (
    <div className={`LanDevices LanDevices--${this.state.showInactive? 'show': 'hide'}-inactive`}>
        <button className="LanDevices__toggle" onClick={this.toggleInactive.bind(this)}>{this.state.showInactive? 'Hide': 'Show'} Inactive Devices</button>
        <div className="LanDevices__devices">
          {this.state.devices.map(device => {
            return <Device
              key={device.mac}
              device={device}
              onToggleInternet={this.onToggleInternet.bind(this, device)}
              onToggleDistractionFilter={this.onToggleDistractionFilter.bind(this, device)}
              onApprove={this.onApprove.bind(this, device)}
              onDisapprove={this.onDisapprove.bind(this, device)}
            />;
          })}
        </div>      
      </div>
    );
  }
}