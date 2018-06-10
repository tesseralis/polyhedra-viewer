// @flow strict
import _ from 'lodash';
import React, { Component } from 'react';
import EventListener from 'react-event-listener';

const desktopWidth = 1024;

// TODO maybe this should be "device context"
const MobileContext = React.createContext({
  width: desktopWidth,
});

export class MobileProvider extends Component<*, *> {
  constructor(props: *) {
    super(props);
    this.state = {
      width: this.getWidth(),
    };
  }

  render() {
    return (
      <MobileContext.Provider value={this.state}>
        <EventListener target="window" onResize={this.handleResize} />
        {this.props.children}
      </MobileContext.Provider>
    );
  }

  handleResize = () => {
    this.setState({ width: this.getWidth() });
  };

  getWidth = () => {
    return window.innerWidth > 0 ? window.innerWidth : window.screen.width;
  };
}

function isMobile(width) {
  return width <= 480;
}

interface Props {
  renderMobile?: () => React$Node;
  renderDesktop?: () => React$Node;
}

export default function MobileTracker({
  renderMobile = _.constant(null),
  renderDesktop = _.constant(null),
}: Props) {
  return (
    <MobileContext.Consumer>
      {({ width }) => (isMobile(width) ? renderMobile() : renderDesktop())}
    </MobileContext.Consumer>
  );
}
