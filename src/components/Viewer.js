import React from 'react'

import X3dScene from '../components/X3dScene'
import SidebarMenu from '../components/SidebarMenu'
import ConfigMenu from '../components/ConfigMenu'
import ViewerTitle from '../components/ViewerTitle'

const Viewer = ({ solid, polyhedron: Polyhedron, sidebar: Sidebar, configForm: ConfigForm }) => (
  <div>
    <X3dScene>
      <Polyhedron solid={solid} />
    </X3dScene>
    <SidebarMenu sidebar={Sidebar} />
    <ConfigMenu configForm={ConfigForm} />
    <ViewerTitle text={solid.name} />
  </div>
)

export default Viewer
