import { connect } from 'react-redux'

import { getPolyhedronConfig } from '../reducers'

import Polyhedron from '../components/Polyhedron'

const mapStateToProps = (state, { params }) => ({
  config: getPolyhedronConfig(state),
})

export default connect(mapStateToProps)(Polyhedron)
