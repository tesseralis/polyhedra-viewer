// @flow strict
import _ from 'lodash';
import React, { Component } from 'react';
import EventListener from 'react-event-listener';
import * as media from 'styles/media';

// TODO maybe this should be "device context"
const DeviceContext = React.createContext({
  width: media.desktopMinWidth,
});

export class DeviceProvider extends Component<*, *> {
  constructor(props: *) {
    super(props);
    this.state = {
      width: this.getWidth(),
    };
  }

  render() {
    return (
      <DeviceContext.Provider value={this.state}>
        <EventListener target="window" onResize={this.handleResize} />
        {this.props.children}
      </DeviceContext.Provider>
    );
  }

  handleResize = () => {
    this.setState({ width: this.getWidth() });
  };

  getWidth = () => {
    return window.innerWidth > 0 ? window.innerWidth : window.screen.width;
  };
}

function isDevice(width) {
  return width <= media.mobileMaxWidth;
}

interface Props {
  renderMobile?: () => React$Node;
  renderDesktop?: () => React$Node;
}

export function DeviceTracker({
  renderMobile = _.constant(null),
  renderDesktop = _.constant(null),
}: Props) {
  return (
    <DeviceContext.Consumer>
      {({ width }) => (isDevice(width) ? renderMobile() : renderDesktop())}
    </DeviceContext.Consumer>
  );
}
