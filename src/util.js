// Lodash functions
import _ from 'lodash'

export const mapObject = (arr, valueIter=_.identity, keyIter=_.identity) => {
  keyIter = _.iteratee(keyIter)
  valueIter = _.iteratee(valueIter)
  return _(arr)
    .map((item, i) => [keyIter(item, i), valueIter(item, i)])
    .fromPairs()
    .value()
}

// Polyhedra data functions

export const escapeName = name => name.replace(/ /g, '-');
