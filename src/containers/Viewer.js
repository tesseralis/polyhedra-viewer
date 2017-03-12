import React from 'react'

import { getSolidData, isValidSolid } from '../constants/polyhedra'
import WrappedViewer from '../components/Viewer'
import Polyhedron from './Polyhedron'
import Sidebar from './Sidebar'
import ConfigForm from './ConfigForm'

const Viewer = ({ params }) => {
  const solid = getSolidData(isValidSolid(params.solid) ? params.solid : 'tetrahedron')
  return <WrappedViewer
    solid={solid}
    polyhedron={Polyhedron}
    sidebar={Sidebar}
    configForm={ConfigForm}
  />
}

export default Viewer
