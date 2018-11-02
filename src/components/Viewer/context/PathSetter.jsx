// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React, { useCallback, useContext } from 'react';
import { withRouter } from 'react-router-dom';
import { escapeName } from 'math/polyhedra/names';

const PathSetter = React.createContext({ setName: _.noop });

export default PathSetter;

export function InnerPathSetterProvider({ history, children }: *) {
  const setPath = useCallback(
    name => history.push(`/${escapeName(name)}/operations`),
    [history],
  );
  return <PathSetter.Provider value={setPath}>{children}</PathSetter.Provider>;
}

// TODO the provider will no longer be necessary once useRouter becomes a thing
export const PathSetterProvider = withRouter(InnerPathSetterProvider);

export function usePathSetter() {
  return useContext(PathSetter);
}
