import { connect } from 'react-redux'
import * as actions from 'actions'
import { isValidSolid } from 'data'
import Polyhedron from 'math/Polyhedron'

export default connect(
  null,
  actions,
  (
    stateProps,
    { setPolyhedron: setPolyhedronRaw, setOperation, setApplyOpts },
    ownProps,
  ) => {
    return {
      ...ownProps,
      setPolyhedron(name) {
        if (!isValidSolid(name)) {
          throw new Error(`Got a solid with an invalid name: ${name}`)
        }
        setPolyhedronRaw(Polyhedron.get(name))
        // FIXME rename
        setOperation(null)
        setApplyOpts({ gyrate: null, using: null })
      },
    }
  },
)
