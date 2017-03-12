import React from 'react'
import { connect } from 'react-redux'

import { isValidSolid, getSolidData } from '../constants/polyhedra'
import { getPolyhedronConfig } from '../reducers'

import X3dScene from '../components/X3dScene'
import Polyhedron from '../components/Polyhedron'
import SidebarMenu from '../components/SidebarMenu'
import ConfigMenu from '../components/ConfigMenu'
import ViewerTitle from '../components/ViewerTitle'

import Sidebar from './Sidebar'
import ConfigForm from './ConfigForm'

// TODO make an actual viewer component that takes care of the stylings
const Viewer = ({ params, polyhedronConfig, groups }) => {
  // TODO improve this rerouting behavior
  const solid = getSolidData(isValidSolid(params.solid) ? params.solid : 'tetrahedron')

  return (
    <div>
      <X3dScene>
        <Polyhedron solid={solid} config={polyhedronConfig} />
      </X3dScene>
      <SidebarMenu sidebar={Sidebar} />
      <ConfigMenu configForm={ConfigForm} />
      <ViewerTitle text={solid.name} />
    </div>
  )
}

const mapStateToProps = state => ({
  polyhedronConfig: getPolyhedronConfig(state),
})

export default connect(mapStateToProps)(Viewer)

