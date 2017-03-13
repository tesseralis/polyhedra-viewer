import _ from 'lodash'

/**
 * Create an object from teh array given the value and key iteratees.
 */
export const mapObject = (arr, valueIter=_.identity, keyIter=_.identity) => {
  keyIter = _.iteratee(keyIter)
  valueIter = _.iteratee(valueIter)
  return _(arr)
    .map((item, i) => [keyIter(item, i), valueIter(item, i)])
    .fromPairs()
    .value()
}

