import _ from 'lodash';

// TODO move this to a util file
export const joinListOfLists = (list, outerSep, innerSep) => {
  return list.map(elem => elem.join(innerSep)).join(outerSep);
}

const groupDisplays = {
  platonic: 'Platonic Solids',
  archimedean: 'Archimedean Solids',
  prisms: 'Prisms',
  antiprisms: 'Antiprisms',
  johnson: 'Johnson Solids',
};

export const groupDisplay = group => groupDisplays[group] || 'Unknown Group';

export const escapeName = name => name.replace(/ /g, '-');
