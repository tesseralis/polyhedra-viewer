import _ from 'lodash';

const groupNames = [
  'platonic',
  'archimedean',
  'prisms',
  'antiprisms',
  'johnson',
];

export const groups = groupNames.map(groupName => ({
  name: groupName,
  polyhedra: require(`./metadata/${groupName}.json`),
}));

export const getSolidData = escapedSolidName => {
  return require(`./polyhedra/${escapedSolidName}.json`);
}
