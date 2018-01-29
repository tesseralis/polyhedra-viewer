import _ from 'lodash'
import { getRelations, getUsingOpts } from 'polyhedra/relations'
import { isValidSolid } from 'data'
import { setPolyhedron as setPolyhedronRaw } from 'reducers/polyhedron'
import { setOperation, setApplyOpts } from 'reducers/controls'
import Polyhedron from 'math/Polyhedron'
import doApplyOperation from 'polyhedra/applyOperation'

// Set the polyhedron

const unsetMode = () => dispatch => {
  dispatch(setMode(null))
  dispatch(setApplyOpts({ gyrate: null, using: null }))
}

export const setPolyhedron = name => dispatch => {
  if (!isValidSolid(name)) {
    throw new Error(`Got a solid with an invalid name: ${name}`)
  }
  dispatch(setPolyhedronRaw(Polyhedron.get(name)))
  dispatch(unsetMode())
}

function hasMultipleOptionsForFace(relations) {
  return _.some(relations, relation => _.includes(['U2', 'R5'], relation.using))
}

const setApplyOptsFor = (solid, operation) => dispatch => {
  if (!solid) return
  const relations = getRelations(solid, operation)
  const newOpts = { gyrate: null, using: null }
  if (operation === '+') {
    if (_.filter(relations, 'gyrate').length > 1) {
      newOpts.gyrate = 'ortho'
    }
    if (hasMultipleOptionsForFace(relations)) {
      newOpts.using = getUsingOpts(solid)[0]
    }
  }
  dispatch(setApplyOpts(newOpts))
}

// Apply the given operation to the given polyhedron
export const applyOperation = (
  operation,
  polyhedron,
  args,
  options,
) => dispatch => {
  const result = doApplyOperation(operation, polyhedron, args, options)

  dispatch(setPolyhedronRaw(result))
  if (_.isEmpty(getRelations(result.name, operation))) {
    dispatch(unsetMode())
  } else {
    dispatch(setApplyOptsFor(result.name, operation))
  }
}

export const setMode = (solid, operation) => dispatch => {
  dispatch(setOperation(operation))
  dispatch(setApplyOptsFor(solid, operation))
}

export const setApplyOpt = (name, value) => dispatch => {
  dispatch(setApplyOpts({ [name]: value }))
}

export * from 'reducers/config'

export * from 'reducers/filter'
