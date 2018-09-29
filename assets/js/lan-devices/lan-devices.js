import React, { Component } from 'react';
import Device from './device';

export default class LanDevices extends Component {

  constructor(props) {
    super(props);
    this.state = {
      devices: [],
      showAll: false
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

  async onRemove(device) {
    const { mac } = device;
    const response = await fetch(`/api/lan-devices/remove/${mac}`, { method: 'post' });
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

  async toggleAll() {
    this.state.showAll = !this.state.showAll;
    this.setState(this.state);
  }

  render() {
    return (
    <div className={`LanDevices LanDevices--${this.state.showAll? 'show': 'hide'}-inactive`}>
        <button className="LanDevices__toggle" onClick={this.toggleAll.bind(this)}>
          {this.state.showAll? 'Hide Inactive': 'Show All'} Devices
        </button>
        <div className="LanDevices__devices">
          {this.state.devices.map(device => {
            return <Device
              key={device.mac}
              device={device}
              onToggleInternet={this.onToggleInternet.bind(this, device)}
              onApprove={this.onApprove.bind(this, device)}
              onRemove={this.onRemove.bind(this, device)}
            />;
          })}
        </div>      
      </div>
    );
  }
}