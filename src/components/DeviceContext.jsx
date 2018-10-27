// @flow strict
// $FlowFixMe
import React, { useState, useEffect, useContext } from 'react';
import { media } from 'styles';

function getWindowWidth() {
  return window.innerWidth > 0 ? window.innerWidth : window.screen.width;
}

// TODO I think this might be better as just a prop
const DeviceContext = React.createContext(media.desktopMinWidth);

interface ProviderProps {
  children?: React$Node;
}

export function DeviceProvider({ children }: ProviderProps) {
  const [width, setWidth] = useState(getWindowWidth());

  useEffect(() => {
    const handleResize = () => setWidth(getWindowWidth());
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <DeviceContext.Provider value={width}>{children}</DeviceContext.Provider>
  );
}

function isMobile(width) {
  return width <= media.mobileMaxWidth;
}

function getOrientation(width) {
  return width <= media.mobilePortraitMaxWidth ? 'portrait' : 'landscape';
}

export function useMediaInfo() {
  const width = useContext(DeviceContext);
  if (isMobile(width)) {
    return { device: 'mobile', orientation: getOrientation(width) };
  }
  return { device: 'desktop', orientation: null };
}
