import _ from 'lodash';

const getPolyhedra = groupName => require(`./groups/${groupName}.json`);

/* Johnson Solid Subgroups */
export const johnsonSolids = getPolyhedra('johnson');
const johnsonSubgroups = require('./johnsonSubgroups.json');
const getEndIndex = i =>
  i === johnsonSubgroups.length - 1 ? 92 : johnsonSubgroups[i + 1].index;
const getJohnsonPolyhedra = () => {
  return johnsonSubgroups.map(({ name, index }, i) => ({
    name,
    polyhedra: johnsonSolids.slice(index, getEndIndex(i)),
  }));
};

const getNestedPolyhedra = groupName => {
  if (groupName === 'johnson') return { groups: getJohnsonPolyhedra() };
  return { polyhedra: getPolyhedra(groupName) };
};

const groupData = require('./groups.json');

const flatGroups = groupData.map(group => ({
  ...group,
  polyhedra: getPolyhedra(group.name),
}));

export const groups = groupData.map(group => ({
  ...group,
  ...getNestedPolyhedra(group.name),
}));

export const allSolidNames = _.flatMap(flatGroups, 'polyhedra');

export const isValidSolid = (escapedSolidName: string) => {
  return allSolidNames.includes(escapedSolidName.replace(/-/g, ' '));
};

// TODO make name escaping consistent *again*
export const getSolidData = (solidName: string) => {
  return require(`data/polyhedra/${solidName.replace(/ /g, '-')}.json`);
};
