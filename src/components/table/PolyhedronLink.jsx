import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { Link } from 'react-router-dom'

import { escapeName } from 'constants/polyhedra'
import { hover } from 'styles/common'

const thumbnailSize = 55

const styles = StyleSheet.create({
  link: {
    width: thumbnailSize,
    height: thumbnailSize,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 10,
    margin: 'auto', // center inside a table
  },

  real: hover,

  image: {
    height: thumbnailSize + 10,
  },

  fake: {
    opacity: 0.25,
    filter: 'grayscale(50%)',
  },
})

export default function PolyhedronLink({ name, isFake }) {
  const escapedName = escapeName(name)
  const img = require(`images/${escapedName}.png`)
  if (isFake) {
    return (
      <div className={css(styles.link, styles.fake)}>
        <img className={css(styles.image)} src={img} alt={name} />
      </div>
    )
  }
  return (
    <Link to={'/' + escapedName} className={css(styles.link, styles.real)}>
      <img className={css(styles.image)} src={img} alt={name} />
    </Link>
  )
}
