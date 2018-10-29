// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React, { useState } from 'react';
import { Polyhedron } from 'math/polyhedra';

const PolyhedronContext = React.createContext({
  polyhedron: Polyhedron.get('tetrahedron'),
  setPolyhedron: _.noop,
});

export default PolyhedronContext;

export function PolyhedronProvider({ setName, name, children }: *) {
  const [polyhedron, setPolyhedron] = useState(Polyhedron.get(name));

  const value = {
    polyhedron,
    setPolyhedron,
    setName,
  };
  return (
    <PolyhedronContext.Provider value={value}>
      {children}
    </PolyhedronContext.Provider>
  );
}
