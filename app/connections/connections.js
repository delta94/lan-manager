import React, { Component } from 'react';
import Connection from './connection';

export default class Connections extends Component {

  constructor(props) {
    super(props);
    this.state = {
      connections: []
    };
  }

  componentWillMount() {
    this.loadConnections();
  }

  componentDidMount() {
    this.startMonitor();
  }

  componentWillUnmount() {
    this.stopMonitor();
  }

  startMonitor() {
    this.connectionTimer = setInterval(async ()=> {
      this.loadConnections();
    }, 3000);
  }

  stopMonitor() {
    clearInterval(this.connectionTimer);
  }

  restartMonitor() {
    this.stopMonitor();
    this.startMonitor();
  }

  async onRestartClick(connection) {
    const { connectionName } = connection;
    const response = await fetch(`/api/connections/refresh/${connectionName}`, { method: 'post' });
    const json = await response.json();

    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }

    await this.loadConnections();
  }

  async onPreferClick(connection) {
    //Give some time for actions to complete before reloading data
    this.restartMonitor();

    //Toggle the state for instant feedback
    const preferred = this.state.connections.find( connection => connection.preferred === true);
    preferred.preferred = false;
    preferred.active = false;
    connection.disabled = false;
    connection.preferred = true;
    connection.active = true;
    this.setState(this.state);

    const { connectionName } = connection;
    if(connection.disabled) await this.toggleConnection(connection);
    const response = await fetch(`/api/connections/prefer/${connectionName}`, { method: 'post' });
    const json = await response.json();
    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }
  }

  async loadConnections() {
    const response = await fetch("/api/connections");
    const json = await response.json();

    if(json.error)  {
      let error = new Error(json.message);
      error.data = json.data;
      error.SERVER_ERROR = true;
      console.error(error);
    }

    this.state.connections = json.data.reverse();
    this.setState(this.state);
  }

  render() {
    return (
      <div className="Connections">
        {this.state.connections.map(connection => {
          return <Connection
            connection={connection}
            key={connection.connectionName}
            onPreferClick={this.onPreferClick.bind(this, connection)}
            onRestartClick={this.onRestartClick.bind(this, connection)}
          />
        })}
      </div>
    );
  }
}

