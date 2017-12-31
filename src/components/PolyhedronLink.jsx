import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { Link } from 'react-router'

import { escapeName } from '../constants/polyhedra'

import { hover } from '../styles/common'

// FIXME this breaks the use in the normal index
const thumbnailSize = 70

const styles = StyleSheet.create({
  link: {
    ...hover,
    width: thumbnailSize,
    height: thumbnailSize,
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 25,
    margin: 'auto', // center inside a table
  },

  image: {
    height: thumbnailSize,
  },
})

export default function PolyhedronList({ name }) {
  const escapedName = escapeName(name)
  const img = require(`../images/${escapedName}.png`)
  return (
    <Link to={'/' + escapedName} className={css(styles.link)}>
      <img className={css(styles.image)} src={img} alt={name} />
    </Link>
  )
}
