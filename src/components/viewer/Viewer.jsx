import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

import { getSolidData, isValidSolid } from 'constants/polyhedra'
import { fixed, fullScreen } from 'styles/common'

import X3dScene from './X3dScene'
import Polyhedron from './Polyhedron'
import { Sidebar } from './sidebar'

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
const Viewer = ({ match }) => {
  const { params } = match
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
        <Sidebar match={match} />
      </div>
    </div>
  )
}

export default Viewer
