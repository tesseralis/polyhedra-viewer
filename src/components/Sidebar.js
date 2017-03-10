import _ from 'lodash'
import React from 'react'
import { Link } from 'react-router'
import { css, StyleSheet } from 'aphrodite/no-important'

import { escapeName } from '../util'
import GroupHeader from './GroupHeader'

import { andaleMono } from '../styles/fonts'
import { resetLink, hover } from '../styles/common'

const PolyhedronLink = ({ name }) => {
  const styles = StyleSheet.create({
    link: {
      ...resetLink,
      ...hover,
      display: 'block',
      padding: '3px 12px',

      color: 'DimGrey',
      lineHeight: '18px',
      fontFamily: andaleMono,
      fontSize: 14,
    },

    isActive: {
      color: 'DarkSlateGray',
      fontWeight: 'bolder',
    },
  })

  return (
    <Link
      to={escapeName(name)}
      className={css(styles.link)}
      activeClassName={css(styles.isActive)}
    >{_.capitalize(name)}</Link>
  )
}

const PolyhedronList = ({ polyhedra }) => {
  return (
    <ul>
      { polyhedra.map(name => (
        <li key={name}><PolyhedronLink name={name} /></li>
      )) }
    </ul>
  )
}

const PolyhedronGroup = ({ name, polyhedra }) => {
  const styles = StyleSheet.create({
    group: {
      padding: '10px 0',
    },

    header: {
      margin: '5px 12px',
    }
  })

  return (
    <div className={css(styles.group)}>
      <GroupHeader name={name} styles={styles.header} />
      <PolyhedronList polyhedra={polyhedra} />
    </div>
  )
}

const Sidebar = ({ groups, setFilterText }) => {
  const styles = StyleSheet.create({
    sidebar: {
      width: 400,
      overflow: 'scroll',
      backgroundColor: 'WhiteSmoke', // TODO colors file
      boxShadow: '1px 1px 4px LightGray',
    },
  })

  return (
    <section className={css(styles.sidebar)}>
      <label>Search:<input type="text" onChange={e => setFilterText(e.target.value)} /></label>
      { groups.map(group => <PolyhedronGroup key={group.name} {...group } /> ) }
    </section>
  )
}

export default Sidebar
