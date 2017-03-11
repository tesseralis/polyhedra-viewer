import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'

import { getSolidData } from '../constants/polyhedra'
import * as Actions from '../actions'
import { getPolyhedronConfig, getConfigValues, getFilteredGroups } from '../reducers'

import Polyhedron from '../components/Polyhedron'
import SidebarMenu from '../components/SidebarMenu'
import ConfigMenu from '../components/ConfigMenu'
import X3dScene from '../components/X3dScene'

const Viewer = ({ params, ...props }) => {
  const solid = getSolidData(params.solid)
  const { polyhedronConfig } = props
  const { groups } = props
  // FIXME how to avoid this denesting situation?
  const { configValues, setInputValue, reset } = props

  return (
    <div>
      <X3dScene>
        <Polyhedron solid={solid} config={polyhedronConfig} />
      </X3dScene>
      <SidebarMenu groups={groups} />
      <ConfigMenu configValues={configValues} setInputValue={setInputValue} reset={reset} />
    </div>
  )
}

// TODO is there something similar to bindActionCreators?
const mapStateToProps = state => ({
  polyhedronConfig: getPolyhedronConfig(state),
  configValues: getConfigValues(state),
  groups: getFilteredGroups(state),
})

const mapDispatchToProps = dispatch => bindActionCreators(Actions, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer)

