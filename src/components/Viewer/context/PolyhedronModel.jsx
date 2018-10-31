// @flow strict
import { Polyhedron } from 'math/polyhedra';
import { createModel } from 'components/common';

const defaultProps = { name: 'tetrahedron' };
export default createModel(
  {
    setPolyhedron: polyhedron => () => polyhedron,
  },
  ({ name } = defaultProps) => Polyhedron.get(name),
);
