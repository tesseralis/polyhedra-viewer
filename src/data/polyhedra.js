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
  polyhedra: getSolidNames(groupName),
}));

export const solids = _(groups)
  .flatMap(({ name, polyhedra }) =>
    polyhedra.map(solidName => [escapeName(solidName), getSolid(solidName, name)]))
  .fromPairs()
  .value();
