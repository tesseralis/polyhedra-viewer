import _ from 'lodash'

/**
 * Create an object from the array given the value and key iteratees.
 */
export const mapObject = (
  arr,
  valueIter = _.identity,
  keyIter = _.identity,
) => {
  keyIter = _.iteratee(keyIter)
  valueIter = _.iteratee(valueIter)
  return _(arr)
    .map((item, i) => [keyIter(item, i), valueIter(item, i)])
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
