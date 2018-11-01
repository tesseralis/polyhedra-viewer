// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React from 'react';
import { withRouter } from 'react-router-dom';
import { escapeName } from 'math/polyhedra/names';

const PathSetter = React.createContext({ setName: _.noop });

export default PathSetter;

export function InnerPathSetterProvider({ history, children }: *) {
  const setName = name => history.push(`/${escapeName(name)}/operations`);
  return <PathSetter.Provider value={setName}>{children}</PathSetter.Provider>;
}

export const PathSetterProvider = withRouter(InnerPathSetterProvider);
