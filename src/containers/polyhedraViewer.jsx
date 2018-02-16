import _ from 'lodash'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'

import { getRelations, getUsingOpts } from 'polyhedra/relations'
import doApplyOperation from 'polyhedra/applyOperation'
import {
  getPolyhedron,
  getOperation,
  getApplyOpts,
  getAugments,
} from 'selectors'
import * as actions from 'actions'

const mapStateToProps = createStructuredSelector({
  polyhedron: getPolyhedron,

  // FIXME we don't actually need this for most things
  operation: getOperation,
  options: getApplyOpts,
  augmentInfo: getAugments,
})

function hasMultipleOptionsForFace(relations) {
  return _.some(relations, relation => _.includes(['U2', 'R5'], relation.using))
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { polyhedron } = stateProps
  const {
    setApplyOpts,
    setOperation,
    setPolyhedron: setPolyhedronRaw,
  } = dispatchProps

  const setApplyOptsFor = (solid, operation) => {
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
    setApplyOpts(newOpts)
  }

  const setMode = operation => {
    setOperation(operation)
    setApplyOptsFor(polyhedron.name, operation)
  }

  const unsetMode = () => {
    setMode(null)
  }

  return {
    ...ownProps,
    ...stateProps,

    setMode,

    // Apply the given operation to the given polyhedron
    applyOperation(operation, args, options) {
      const result = doApplyOperation(operation, polyhedron, args, options)
      setPolyhedronRaw(result)

      if (_.isEmpty(getRelations(result.name, operation))) {
        unsetMode()
      } else {
        setApplyOptsFor(result.name, operation)
      }
    },

    setApplyOpt(name, value) {
      setApplyOpts({ [name]: value })
    },
  }
}

export default connect(mapStateToProps, actions, mergeProps)
