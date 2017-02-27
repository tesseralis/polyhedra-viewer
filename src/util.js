/**
 * Join a list of lists with an inner and outer separator.
 *
 * Usage:
 * joinListOfLists([[1, 0], [0, 1], ', ', ' ') // ==> 1 0, 0 1
 */
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

// Polyhedra data functions

export const groupDisplay = group => groupDisplays[group] || 'Unknown Group';

export const escapeName = name => name.replace(/ /g, '-');
