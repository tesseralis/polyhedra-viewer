// @flow strict
import _ from 'lodash';
import * as React from 'react';
import EventListener from 'react-event-listener';
import { media } from 'styles';

const DeviceContext = React.createContext({
  width: media.desktopMinWidth,
});

interface ProviderProps {
  children?: React.Node;
}

interface ProviderState {
  width: number;
}

export class DeviceProvider extends React.Component<
  ProviderProps,
  ProviderState,
> {
  constructor(props: ProviderProps) {
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

  getWidth = (): number => {
    return window.innerWidth > 0 ? window.innerWidth : window.screen.width;
  };
}

function isMobile(width) {
  return width <= media.mobileMaxWidth;
}

function getOrientation(width) {
  return width <= media.mobilePortraitMaxWidth ? 'portrait' : 'landscape';
}

interface RenderMobileArgs {
  orientation?: 'portrait' | 'landscape';
}

interface Props {
  renderMobile?: (args: RenderMobileArgs) => React$Node;
  renderDesktop?: () => React$Node;
}

export function DeviceTracker({
  renderMobile = _.constant(null),
  renderDesktop = _.constant(null),
}: Props) {
  return (
    <DeviceContext.Consumer>
      {({ width }) =>
        isMobile(width)
          ? renderMobile({ orientation: getOrientation(width) })
          : renderDesktop()
      }
    </DeviceContext.Consumer>
  );
}
