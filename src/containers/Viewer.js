import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'

import Polyhedron from '../components/Polyhedron'
import ViewerMenu from '../components/ViewerMenu'
import X3dScene from '../components/X3dScene'
import { getSolidData } from '../data'
import * as ConfigActions from '../actions'
import { getPolyhedronConfig, getMenuConfig } from '../reducers/config'

const Viewer = ({ polyhedronConfig, menuConfig, actions, params }) => {
  const solidName = params.solid || 'tetrahedron'
  const solid = getSolidData(solidName)

  return (
    <div>
      <ViewerMenu config={menuConfig} actions={actions} />
      <X3dScene>
        <Polyhedron solid={solid} config={polyhedronConfig} />
      </X3dScene>
    </div>
  )
}

const mapStateToProps = state => ({
  polyhedronConfig: getPolyhedronConfig(state.config),
  menuConfig: getMenuConfig(state.config),
})

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(ConfigActions, dispatch)
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer)
