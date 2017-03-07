import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

const size = 60;
const styles = StyleSheet.create({
  bigIcon: {
    display: 'flex',
    margin: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    width: size,
    height: size,
    fontSize: 48,
  }
})

// TODO Use icons instead of unicode
const BigIcon = ({ symbol }) => {
  return (
    <div className={css(styles.bigIcon)}>{ symbol }</div>
  )
}

export default BigIcon
