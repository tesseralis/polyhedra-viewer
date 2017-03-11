import React from 'react'
import { connect } from 'react-redux'

import { getSolidData } from '../constants/polyhedra'
import { getPolyhedronConfig } from '../reducers'

import Polyhedron from '../components/Polyhedron'
import SidebarMenu from '../components/SidebarMenu'
import ConfigMenu from '../components/ConfigMenu'
import X3dScene from '../components/X3dScene'

const Viewer = ({ params, polyhedronConfig, groups }) => {
  const solid = getSolidData(params.solid)

  return (
    <div>
      <X3dScene>
        <Polyhedron solid={solid} config={polyhedronConfig} />
      </X3dScene>
      <SidebarMenu />
      <ConfigMenu />
    </div>
  )
}

// TODO is there something similar to bindActionCreators?
const mapStateToProps = state => ({
  polyhedronConfig: getPolyhedronConfig(state),
})

export default connect(mapStateToProps)(Viewer)

