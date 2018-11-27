import React, { useState, useEffect, useContext } from 'react';
import { media } from 'styles';
import { ChildrenProp } from 'types';

function getWindowWidth() {
  return window.innerWidth > 0 ? window.innerWidth : window.screen.width;
}

// The reason we use context is so that we only need to bind one listener to the window
const DeviceContext = React.createContext(media.desktopMinWidth);

export function DeviceProvider({ children }: ChildrenProp) {
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

function isMobile(width: number) {
  return width <= media.mobileMaxWidth;
}

function getOrientation(width: number) {
  return width <= media.mobilePortraitMaxWidth ? 'portrait' : 'landscape';
}

export default function useMediaInfo() {
  const width = useContext(DeviceContext);
  if (isMobile(width)) {
    return { device: 'mobile', orientation: getOrientation(width) };
  }
  return { device: 'desktop', orientation: null };
}
