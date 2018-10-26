// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React, { useState, useCallback } from 'react';
import EventListener from 'react-event-listener';
import { media } from 'styles';

function getWidth() {
  return window.innerWidth > 0 ? window.innerWidth : window.screen.width;
}

// TODO I think this might be better as just a prop
const DeviceContext = React.createContext(media.desktopMinWidth);

interface ProviderProps {
  children?: React$Node;
}

export function DeviceProvider({ children }: ProviderProps) {
  const [width, setWidth] = useState(getWidth());
  const handleResize = useCallback(() => {
    setWidth(getWidth());
  });

  return (
    <DeviceContext.Provider value={width}>
      {/* TODO get rid of event listener! */}
      <EventListener target="window" onResize={handleResize} />
      {children}
    </DeviceContext.Provider>
  );
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
      {width =>
        isMobile(width)
          ? renderMobile({ orientation: getOrientation(width) })
          : renderDesktop()
      }
    </DeviceContext.Consumer>
  );
}
