import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

const styles = StyleSheet.create({

  configMenu: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  }
})

const ConfigMenu = ({ config, actions }) => {
  const { showEdges, showFaces, edgeWidth, opacity } = config
  const { toggleEdges, toggleFaces, setEdgeWidth, setOpacity, reset } = actions
  return (
    <form className={css(styles.configMenu)}>
      <label>
        Show Edges<input type="checkbox" checked={showEdges} onChange={toggleEdges}/>
      </label>
      <label>
        Show Faces<input type="checkbox" checked={showFaces} onChange={toggleFaces}/>
      </label>
      <label>
        Edge Width
        <input
          type="range"
          min="1"
          max="30"
          step="1"
          value={edgeWidth}
          onChange={evt => setEdgeWidth(evt.target.value)}
        />
      </label>
      <label>
        Opacity
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={evt => setOpacity(evt.target.value)}
        />
      </label>
      <button type="button" onClick={reset}>Reset</button>
    </form>
  )
}

export default ConfigMenu
