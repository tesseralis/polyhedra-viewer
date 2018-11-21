import React, { useContext } from 'react';

const state = {
  device: 'desktop',
  orientation: null,
};

const DeviceContext = React.createContext(state);
export const DeviceProvider = DeviceContext.Provider;

export default function useMediaInfo() {
  return useContext(DeviceContext);
}
