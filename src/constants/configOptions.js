import _ from 'lodash'

const configOptionsList = [
  {
    key: 'showEdges',
    display: 'Show Edges',
    type: 'checkbox',
    default: true,
  },
  {
    key: 'showFaces',
    display: 'Show Faces',
    type: 'checkbox',
    default: true,
  },
  {
    key: 'opacity',
    display: 'Opacity',
    type: 'range',
    default: 0.9,
    min: 0,
    max: 1,
    step: 0.01,
  },
]

export const configKeys = _.map(configOptionsList, 'key')

// TODO can I use normalizr?
export const configOptions = _(configOptionsList)
  .map(option => [option.key, option])
  .fromPairs()
  .value()
