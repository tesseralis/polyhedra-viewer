/**
 * Join a list of lists with an inner and outer separator.
 *
 * Usage:
 * joinListOfLists([[1, 0], [0, 1], ', ', ' ') // ==> 1 0, 0 1
 */
export const joinListOfLists = (list, outerSep, innerSep) => {
  return list.map(elem => elem.join(innerSep)).join(outerSep);
}

// Polyhedra data functions

export const escapeName = name => name.replace(/ /g, '-');
