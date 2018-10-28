// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React, { useState, useEffect } from 'react';
import { Polyhedron } from 'math/polyhedra';

const PolyhedronContext = React.createContext({
  polyhedron: Polyhedron.get('tetrahedron'),
  setPolyhedron: _.noop,
});

export default PolyhedronContext;

export function PolyhedronProvider({ disabled, setName, name, children }: *) {
  const [polyhedron, setPolyhedron] = useState(Polyhedron.get(name));

  // If this is disabled, derive the polyhedron from the passed in name
  useEffect(
    () => {
      if (disabled) {
        setPolyhedron(Polyhedron.get(name));
      }
    },
    // We memoize only the *name* because we want to keep the current model even if
    // we go from enabled to something else.
    [name],
  );

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
