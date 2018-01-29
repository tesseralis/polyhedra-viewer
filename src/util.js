import _ from 'lodash'

/**
 * Create an object from the array using the iteratee
 */
export const mapObject = (arr, iteratee) => {
  return _(arr)
    .map(iteratee)
    .fromPairs()
    .value()
}

/**
 * Replace the given index in the array with the given values. Alternative to "splice".
 */
export function replace(array, index, ...values) {
  const before = _.take(array, index)
  const after = _.slice(array, index + 1)
  return [...before, ...values, ...after]
}
