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
  operation: getOperation,
  options: getApplyOpts,
  // TODO move this out
  augmentInfo: getAugments,
})

function hasMultipleOptionsForFace(relations) {
  return _.some(relations, relation => _.includes(['U2', 'R5'], relation.using))
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { polyhedron, options } = stateProps
  const {
    setApplyOpts,
    setOperation,
    setPolyhedron: setPolyhedronRaw,
  } = dispatchProps

  const setApplyOptsFor = (solid, operation) => {
    if (!solid) return
    const relations = getRelations(solid, operation)
    const newOpts = {}
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
    unsetMode,

    // Apply the given operation to the given polyhedron
    applyOperation(operation, args) {
      const result = doApplyOperation(operation, polyhedron, {
        ...args,
        ...options,
      })
      setPolyhedronRaw(result)

      // FIXME gyrate -> twist needs to be unset
      if (_.isEmpty(getRelations(result.name, operation))) {
        unsetMode()
      } else {
        setApplyOptsFor(result.name, operation)
      }
    },

    recenter() {
      setPolyhedronRaw(polyhedron.center())
    },

    setApplyOpt(name, value) {
      setApplyOpts({ ...options, [name]: value })
    },
  }
}

export default connect(mapStateToProps, actions, mergeProps)
