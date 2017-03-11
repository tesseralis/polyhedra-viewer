import React from 'react'
import { connect } from 'react-redux'

import { isValidSolid, getSolidData } from '../constants/polyhedra'
import { getPolyhedronConfig } from '../reducers'

import Polyhedron from '../components/Polyhedron'
import SidebarMenu from '../components/SidebarMenu'
import ConfigMenu from '../components/ConfigMenu'
import X3dScene from '../components/X3dScene'

import Sidebar from './Sidebar'
import ConfigForm from './ConfigForm'

const Viewer = ({ params, polyhedronConfig, groups }) => {
  // TODO improve this logic
  const solid = getSolidData(isValidSolid(params.solid) ? params.solid : 'tetrahedron')

  return (
    <div>
      <X3dScene>
        <Polyhedron solid={solid} config={polyhedronConfig} />
      </X3dScene>
      <SidebarMenu sidebar={Sidebar}/>
      <ConfigMenu configForm={ConfigForm}/>
    </div>
  )
}

// TODO is there something similar to bindActionCreators?
const mapStateToProps = state => ({
  polyhedronConfig: getPolyhedronConfig(state),
})

export default connect(mapStateToProps)(Viewer)

