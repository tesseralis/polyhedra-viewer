import _ from 'lodash'
import React from 'react'
import { Link } from 'react-router'
import { css } from 'aphrodite/no-important'

import { escapeName } from '../util'
import { groups } from '../constants/polyhedra'
import GroupHeader from './GroupHeader'
import styles from './SidebarStyles'

const Sidebar = () => {
  return (
    <section className={css(styles.sidebar)}>
      { groups.map(group => (
        <div className={css(styles.group)} key={group.name}>
          <GroupHeader name={group.name} styles={styles.groupHeader} />
          <ul>{
            group.polyhedra.map(polyhedronName => (
              <li key={polyhedronName}>
                <Link
                  to={escapeName(polyhedronName)}
                  className={css(styles.link)}
                  activeClassName={css(styles.isActive)}
                >{_.capitalize(polyhedronName)}</Link>
              </li>
            ))
          }</ul>
        </div>
      )) }
    </section>
  )
}

export default Sidebar
