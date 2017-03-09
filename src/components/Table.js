import React from 'react'
import { css } from 'aphrodite/no-important'
import { Link } from 'react-router'

import { groups } from '../constants/polyhedra'
import { escapeName } from '../util'
import commonStyles from '../styles/common'
import GroupHeader from './GroupHeader'

import styles from './TableStyles'

const Table = () => {
  return (
    <div className={css(styles.table)}>
      <h1 className={css(styles.title)}>Polyhedra Viewer</h1>
      { groups.map(group => (
        <div key={group.name} className={css(styles.group)}>
          <GroupHeader name={group.name} styles={styles.groupHeader} />
          <p className={css(styles.groupDescription)}>{group.description}</p>
          <div className={css(styles.list)}>
            { group.polyhedra.map(polyhedronName => {
              const escapedName = escapeName(polyhedronName)
              const img = require(`../images/${escapedName}.png`)
              return (
                <Link
                  key={polyhedronName}
                  to={'/' + escapedName}
                  className={css(styles.link, commonStyles.hover)}
                >
                  <img className={css(styles.image)} src={img} alt={polyhedronName}></img>
                </Link>
              )
            }) }
          </div>
        </div>
      )) }
    </div>
  )
}

export default Table
