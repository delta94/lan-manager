import React, { Component } from 'react';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

export default class Speed extends Component {

  constructor(props) {
    super(props);
    this.state = {
      speed: {
        upload: 0,
        download: 0
      },
      speedHistory: {
        upload: Array(15).fill(0),
        download: Array(15).fill(0)
      }
    };
  }

  componentDidMount() {
    this.startMonitor();
  }

  componentWillUnmount() {
    this.stopConnectionMonitor();
  }

  round(number, precision) {
    const factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
  }

  parseBytes(bytes) {
    let speed = this.round(bytes/ (1024 * 1024), 2);
    let unit = 'Mbps';
    return { speed, unit };
  }

  trimSpeedHistory() {
    this.state.speedHistory.upload = this.state.speedHistory.upload.slice(-15);
    this.state.speedHistory.download = this.state.speedHistory.download.slice(-15);
  }

  startMonitor() {
    this.connectionTimer = setInterval(async ()=> {
      const response = await fetch(`/api/throughput/ether1-LAN`);
      const { data } = await response.json();

      this.state.speed = { upload: data.rxSpeed, download: data.txSpeed };
      this.state.speedHistory.upload.push(data.rxSpeed);
      this.state.speedHistory.download.push(data.txSpeed);
      this.trimSpeedHistory();

      this.setState(this.state);
    }, 1000);
  }

  stopConnectionMonitor() {
    clearInterval(this.connectionTimer);
  }

  render() {
    return (
      <div className="Speed">
        <div className="Speed__upload">
          <div className="Speed__speed">
            <i className="Speed__icon icon-arrow_upward"></i>
            { this.parseBytes(this.state.speed.upload).speed }
          </div>
          <div className="Speed__graph">
            <Sparklines data={this.state.speedHistory.upload} height={25}>
              <SparklinesLine style={{ strokeWidth: 1, stroke: 'white', fill: 'white', fillOpacity: '.2'}} />
              <SparklinesSpots style={{ fill: 'white' }} />
            </Sparklines>
          </div>
          <div className="Speed__unit">
            { this.parseBytes(this.state.speed.upload).unit }
          </div>
        </div>
        <div className="Speed__download">
          <div className="Speed__speed">
            <i className="Speed__icon icon-arrow_downward"></i>
            { this.parseBytes(this.state.speed.download).speed }
          </div>
          <div className="Speed__graph">
            <Sparklines data={this.state.speedHistory.download} height={25}>
              <SparklinesLine style={{ strokeWidth: 1, stroke: 'white', fill: 'white', fillOpacity: '.2'}} />
              <SparklinesSpots style={{ fill: 'white' }} />
            </Sparklines>
          </div>
          <div className="Speed__unit">
            { this.parseBytes(this.state.speed.download).unit }
          </div>
        </div>
      </div>
    );
  }
}
