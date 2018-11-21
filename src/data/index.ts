import _ from 'lodash';
import johnsonSubgroups from './johnsonSubgroups';
import johnsonSymmetries from './johnsonSymmetries';
import groupData from './groups';

const getPolyhedra = (groupName: string) =>
  require(`./groups/${groupName}.json`);

/* Johnson Solid Subgroups */
export const johnsonSolids = getPolyhedra('johnson');
const getEndIndex = (i: number) =>
  i === johnsonSubgroups.length - 1 ? 92 : johnsonSubgroups[i + 1].index;
const getJohnsonPolyhedra = () => {
  return johnsonSubgroups.map(({ name, index }, i) => ({
    name,
    polyhedra: johnsonSolids.slice(index, getEndIndex(i)),
  }));
};

const getNestedPolyhedra = (groupName: string) => {
  if (groupName === 'johnson') return { groups: getJohnsonPolyhedra() };
  return { polyhedra: getPolyhedra(groupName) };
};

const flatGroups = groupData.map(group => ({
  ...group,
  polyhedra: getPolyhedra(group.name),
}));

export const groups = groupData.map(group => ({
  ...group,
  ...getNestedPolyhedra(group.name),
}));

export const allSolidNames: string[] = _.flatMap(flatGroups, 'polyhedra');

export const isValidSolid = (escapedSolidName: string) => {
  return allSolidNames.includes(escapedSolidName.replace(/-/g, ' '));
};

export const getSolidData = (solidName: string) => {
  return require(`data/polyhedra/${solidName.replace(/ /g, '-')}.json`);
};

export function getJohnsonSymmetry(name: string) {
  return johnsonSymmetries[johnsonSolids.indexOf(name)];
}
