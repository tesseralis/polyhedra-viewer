import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

const styles = StyleSheet.create({

  configMenu: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  }
})

const ConfigMenu = () => {
  return (
    <form className={css(styles.configMenu)}>
      <label>
        Show Edges<input type="checkbox" />
      </label>
      <label>
        Show Faces<input type="checkbox" />
      </label>
      <label>
        Edge Width<input type="range" />
      </label>
      <label>
        Opacity<input type="range" />
      </label>
    </form>
  )
}

export default ConfigMenu
