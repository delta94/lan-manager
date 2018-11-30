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
    this.startMonitor();
  }

  componentWillUnmount() {
    this.stopMonitor();
  }

  startMonitor() {
    this.deviceTimer = setInterval(async ()=> {
      this.loadDevices();
    }, 3000);
  }

  restartMonitor() {
    this.stopMonitor();
    this.startMonitor();
  }

  stopMonitor() {
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
    //Give some time for actions to complete before reloading data
    this.restartMonitor();

    //Change the state for instant feedback
    this.state.devices = this.state.devices.filter( d => d.mac !== device.mac );
    this.setState(this.state);
    
    const { mac } = device;
    const response = await fetch(`/api/lan-devices/remove/${mac}`, { method: 'post' });
    const json = await response.json();
    
    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }
  }

  async onToggleInternet(device) {
    //Give some time for actions to complete before reloading data
    this.restartMonitor();

    //Toggle the state for instant feedback
    device.blocked = !device.blocked;
    this.setState(this.state);
    
    const { mac } = device;
    const response = await fetch(`/api/lan-devices/toggle-internet/${mac}`, { method: 'post' });
    const json = await response.json();
    
    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }
  }

  sortDevices(devices) {
    //Put active devices on top then inactive devices, put the unapproved devices on the bottom
    const activeDevices = devices.filter( device=> device.approved && device.active );
    const inactiveDevices = devices.filter( device=> device.approved && !device.active );
    const inactiveDevicesWithData = inactiveDevices.filter( device=> device.downloadBytes || device.uploadBytes );
    const inactiveDevicesWithoutData = inactiveDevices.filter( device=> !device.downloadBytes && !device.uploadBytes );
    const unapprovedDevices = devices.filter( device=> !device.approved );
    return [ ...activeDevices, ...inactiveDevicesWithData, ...inactiveDevicesWithoutData, ...unapprovedDevices ];
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

    this.state.devices = this.sortDevices(json.data);
    this.setState(this.state);
  }

  async toggleAll() {
    this.state.showAll = !this.state.showAll;
    this.setState(this.state);
  }

  render() {
    return (
    <div className={`LanDevices LanDevices--show-${this.state.showAll? 'all': 'some'}`}>
        <button className="LanDevices__toggle" onClick={this.toggleAll.bind(this)}>
          {this.state.showAll? 'Show Fewer': 'Show All'} Devices
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
