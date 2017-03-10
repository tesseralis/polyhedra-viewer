import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'

import { getSolidData } from '../constants/polyhedra'
import * as ConfigActions from '../actions'
import { getPolyhedronConfig, getConfigValues } from '../reducers/config'

import Polyhedron from '../components/Polyhedron'
import SidebarMenu from '../components/SidebarMenu'
import ConfigMenu from '../components/ConfigMenu'
import X3dScene from '../components/X3dScene'

const Viewer = ({ polyhedronConfig, params, ...configMenuProps }) => {
  const solidName = params.solid || 'tetrahedron'
  const solid = getSolidData(solidName)

  return (
    <div>
      <X3dScene>
        <Polyhedron solid={solid} config={polyhedronConfig} />
      </X3dScene>
      <SidebarMenu />
      <ConfigMenu {...configMenuProps} />
    </div>
  )
}

const mapStateToProps = state => ({
  polyhedronConfig: getPolyhedronConfig(state.config),
  configValues: getConfigValues(state.config),
})

const mapDispatchToProps = dispatch => bindActionCreators(ConfigActions, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer)
