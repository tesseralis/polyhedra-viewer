// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React from 'react';

const PolyhedronContext = React.createContext({
  setName: _.noop,
});

export default PolyhedronContext;

export function PolyhedronProvider({ setName, children }: *) {
  const value = { setName };
  return (
    <PolyhedronContext.Provider value={value}>
      {children}
    </PolyhedronContext.Provider>
  );
}
