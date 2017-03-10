import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'

import { getSolidData } from '../constants/polyhedra'
import * as ConfigActions from '../actions'
import { getPolyhedronConfig, getConfigValues } from '../reducers/config'
import { getFilteredGroups } from '../reducers/filter'

import Polyhedron from '../components/Polyhedron'
import SidebarMenu from '../components/SidebarMenu'
import ConfigMenu from '../components/ConfigMenu'
import X3dScene from '../components/X3dScene'

const Viewer = ({ params, ...props }) => {
  const solid = getSolidData(params.solid)
  const { polyhedronConfig } = props
  const { groups, setFilterText } = props
  // FIXME how to avoid this denesting situation?
  const { configValues, setInputValue, reset } = props

  return (
    <div>
      <X3dScene>
        <Polyhedron solid={solid} config={polyhedronConfig} />
      </X3dScene>
      <SidebarMenu groups={groups} setFilterText={setFilterText} />
      <ConfigMenu configValues={configValues} setInputValue={setInputValue} reset={reset} />
    </div>
  )
}

// FIXME add a reducing function
const mapStateToProps = state => ({
  polyhedronConfig: getPolyhedronConfig(state.config),
  configValues: getConfigValues(state.config),
  groups: getFilteredGroups(state.filter),
})

const mapDispatchToProps = dispatch => bindActionCreators(ConfigActions, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer)
