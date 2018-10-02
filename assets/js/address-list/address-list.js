import React, { Component } from 'react';
import Address from './address';

export default class AddressList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      list: []
    };
  }

  componentWillMount() {
    this.loadList();
  }

  componentDidMount() {
    this.startMonitor();
  }

  componentWillUnmount() {
    this.stopMonitor();
  }

  startMonitor() {
    this.deviceTimer = setInterval(async ()=> {
      this.loadList();
    }, 3000);
  }

  stopMonitor() {
    clearInterval(this.deviceTimer);
  }

  restartMonitor() {
    this.stopMonitor();
    this.startMonitor();
  }

  async onToggleClick(listItem) {
    const address = listItem.address;

    //Give some time for actions to complete before reloading data
    this.restartMonitor();
    
    //Toggle the state for instant feedback
    listItem.disabled = !listItem.disabled;
    this.setState(this.state);

    const response = await fetch(`/api/address-list/${this.props.list}/${address}/toggle`, { method: 'post' });
    const json = await response.json();

    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }
  }

  async loadList() {
    const response = await fetch(`/api/address-list/${this.props.list}`);
    const json = await response.json();
    
    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }

    this.state.list = json.data;
    this.setState(this.state);
  }

  render() {
    return (
      <div className="AddressList">
        {this.state.list.map(listItem => {
          return <Address
            key={listItem.address}
            address={listItem.address}
            disabled={listItem.disabled}
            label={listItem.label}
            icon={this.props.icon}
            onToggleClick={this.onToggleClick.bind(this, listItem)}
          />;
        })}   
      </div>
    );
  }
}