import React from 'react'
import { StyleSheet } from 'aphrodite/no-important'
import _ from 'lodash'

import { getSolidData, isValidSolid } from 'constants/polyhedra'
import { fixed } from 'styles/common'

import X3dScene from './X3dScene'
import SidebarMenu from './SidebarMenu'
import ConfigMenu from './ConfigMenu'
import Title from './Title'
import Polyhedron from './Polyhedron'
import Sidebar from './Sidebar'
import ConfigForm from './ConfigForm'

const styles = StyleSheet.create({
  title: {
    padding: 36,
    ...fixed('bottom', 'right'),
    maxWidth: '50%',
    textAlign: 'right',
  },
})

// FIXME separate out parameters
const Viewer = ({ params }) => {
  const solid = getSolidData(
    isValidSolid(params.solid) ? params.solid : 'tetrahedron',
  )

  return (
    <div>
      <X3dScene>
        <Polyhedron solid={solid} />
      </X3dScene>
      <SidebarMenu sidebar={Sidebar} />
      <ConfigMenu configForm={ConfigForm} />
      <Title styles={styles.title} name={_.capitalize(solid.name)} />
    </div>
  )
}

export default Viewer
