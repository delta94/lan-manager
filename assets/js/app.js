import React from 'react';
import ReactDOM from 'react-dom';
import Devices from './devices';
import Throughput from './throughput';
import Connections from './connections';
import Wifi from './wifi';
import Power from './power';
import '../scss/style.scss';

function Section({ title, children, name }) {
  return (
    <div className={`Section Section--${name}`}>
      <h2 className="Section__title">{title}</h2>
      <div className="Section__content">{children}</div>
    </div>
  );
}

function App(){
  return (
    <>
      <header className="Header">
        <h2 className="Header__title">LAN Manager</h2>
      </header>
      <div className="Main">
        <Section title="Connections" name="connections"><Connections/></Section>
        <Section title="Throughput" name="throughput"><Throughput/></Section>
        <Section title="Guest Network" name="wifi"><Wifi/></Section>
        <Section title="Electricity" name="power"><Power/></Section>
        <Section title="Devices" name="devices"><Devices/></Section>
      </div>
    </>
  );
}

ReactDOM.render(<App/>, document.getElementById('app'));
