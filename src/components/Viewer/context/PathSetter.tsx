import _ from 'lodash';

import React, { useCallback, useContext } from 'react';
import { History } from 'history';
import { withRouter } from 'react-router-dom';
import { escapeName } from 'math/polyhedra/names';
import { ChildrenProp } from 'types';

const PathSetter = React.createContext(_.noop);

export default PathSetter;

interface Props extends ChildrenProp {
  history: History;
}
export function InnerPathSetterProvider({ history, children }: Props) {
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
