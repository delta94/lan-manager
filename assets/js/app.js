import React from 'react';
import ReactDOM from 'react-dom';
import Devices from './devices';
import Throughput from './throughput';
import Connections from './connections';
import Wifi from './wifi';
import Power from './power';
import '../scss/style.scss';

function MainSection({ title, children, name }) {
  return (
    <div className={`MainSection MainSection--${name}`}>
      <h2 className="MainSection__title">{title}</h2>
      <div className="MainSection__content">{children}</div>
    </div>
  );
}

function App(){
  return (
    <>
      <header className="MainHeader">
        <h2 className="MainHeader__title">LAN Manager</h2>
      </header>
      <div className="MainContent">
        <MainSection title="Connections" name="connections"><Connections/></MainSection>
        <MainSection title="Throughput" name="speed"><Throughput/></MainSection>
        <MainSection title="Guest Network" name="wifi"><Wifi/></MainSection>
        <MainSection title="Electricity" name="power"><Power/></MainSection>
        <MainSection title="Devices" name="devices"><Devices/></MainSection>
      </div>
    </>
  );
}

ReactDOM.render(<App/>, document.getElementById('app'));