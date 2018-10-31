// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React from 'react';

const PathSetter = React.createContext({
  setName: _.noop,
});

export default PathSetter;

export function PathSetterProvider({ setName, children }: *) {
  const value = { setName };
  return <PathSetter.Provider value={value}>{children}</PathSetter.Provider>;
}
