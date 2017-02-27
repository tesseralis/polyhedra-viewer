import _ from 'lodash';
import { escapeName } from '../util';

const groupNames = [
  'platonic',
  'archimedean',
  'prisms',
  'antiprisms',
  'johnson',
];

const getSolidNames = groupName => require(`./metadata/${groupName}.json`);
const getSolid = (solidName, groupName) =>
  require(`./polyhedra/${groupName}/${solidName.replace(/ /g, '_')}.json`);

export const groups = groupNames.map(groupName => ({
  name: groupName,
  polyhedra: getSolidNames(groupName).map(solidName => getSolid(solidName, groupName)),
}));

export const solids = _(groups)
  .flatMap('polyhedra')
  .map(polyhedron => [escapeName(polyhedron.name), polyhedron])
  .fromPairs()
  .value();
