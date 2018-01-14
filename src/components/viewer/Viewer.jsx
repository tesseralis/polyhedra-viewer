import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import _ from 'lodash'

import { getSolidData, isValidSolid } from 'constants/polyhedra'
import { fixed, fullScreen } from 'styles/common'

import X3dScene from './X3dScene'
import SidebarMenu from './SidebarMenu'
import ConfigMenu from './ConfigMenu'
import Title from './Title'
import Polyhedron from './Polyhedron'
import Sidebar from './Sidebar'
import ConfigForm from './ConfigForm'

const styles = StyleSheet.create({
  viewer: {
    ...fullScreen,
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
  },
  sidebar: {
    height: '100%',
    position: 'fixed',
    right: 0,
  },
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

  // FIXME resizing (decreasing height) for the x3d scene doesn't work well
  return (
    <div className={css(styles.viewer)}>
      <X3dScene>
        <Polyhedron solid={solid} />
      </X3dScene>
      <div className={css(styles.sidebar)}>
        <Sidebar />
      </div>
      {/* 
      <SidebarMenu sidebar={Sidebar} />
      <ConfigMenu configForm={ConfigForm} />
      <Title styles={styles.title} name={_.capitalize(solid.name)} />
    */}
    </div>
  )
}

export default Viewer
