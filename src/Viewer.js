import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'

import Polyhedron from './Polyhedron'
import ViewerMenu from './ViewerMenu'
import X3dScene from './X3dScene'
import { getSolidData } from './data'
import * as ConfigActions from './actions'

const Viewer = ({ config, actions, params }) => {
  const solidName = params.solid || 'tetrahedron'
  const solid = getSolidData(solidName)

  return (
    <div>
      <ViewerMenu config={config} actions={actions} />
      <X3dScene>
        <Polyhedron solid={solid} config={config} />
      </X3dScene>
    </div>
  )
}

const mapStateToProps = state => _.pick(state, 'config')

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(ConfigActions, dispatch)
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer)
