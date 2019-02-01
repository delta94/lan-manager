import React, { Component } from 'react';
import ReactDOM from 'react-dom';

export default class Connection extends Component {

  constructor() {
    super();
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onRestartClick = this.onRestartClick.bind(this);
    this.state = {
      hover: false
    }
  }

  componentDidMount() {
    this.listenHover();
  }

  componentWillUnmount() {
    this.unlistenHover();
  }

  onMouseOver(e) {
    if(!e.originalTarget.classList.contains('Connection__action')) {
      this.state.hover = true;
      this.setState(this.state);
    }
  }

  onMouseOut(e) {
    this.state.hover = false;
    this.setState(this.state);
  }

  listenHover() {
    const element = ReactDOM.findDOMNode(this);
    element.addEventListener('mouseover', this.onMouseOver);
    element.addEventListener('mouseout', this.onMouseOut);
  }

  unlistenHover() {
    const element = ReactDOM.findDOMNode(this);
    element.removeEventListener('mouseover', this.onMouseOver);
    element.removeEventListener('mouseout', this.onMouseOut);
  }

  onRestartClick(e) {
    e.stopPropagation();
    this.props.onRestartClick();
  }

  render() {
    const className = [
      `Connection`,
      `Connection--${this.state.hover ? 'hover': 'not-hover'}`,
      `Connection--${this.props.connection.running ? 'running': 'not-running'}`,
      `Connection--${this.props.connection.disabled ? 'disabled': 'not-disabled'}`,
      `Connection--${this.props.connection.active ? 'active': 'not-active'}`,
      `Connection--${this.props.connection.preferred ? 'preferred': 'not-preferred'}`
    ].join(' ');
    return (
      <a className={className} onClick={this.props.onPreferClick}>
        <div className="Connection__preferred-icon" title="Preferred Connection">
          <i className="icon-favorite"></i>
        </div>
        <div className="Connection__label">
          { this.props.connection.label }
        </div>
        <div className="Connection__actions">
          <button className="Connection__action" onClick={this.onRestartClick} title="Restart Connection"><i className="icon-refresh"></i> Refresh</button>
        </div>
      </a>
    );
  }
}
