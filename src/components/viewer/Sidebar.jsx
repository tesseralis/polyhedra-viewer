import _ from 'lodash'
import React from 'react'
import { Link } from 'react-router'
import { css, StyleSheet } from 'aphrodite/no-important'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'

import { getFilteredGroups } from 'selectors'
import { escapeName } from 'constants/polyhedra'
import { andaleMono } from 'styles/fonts'
import { resetLink, hover } from 'styles/common'

import { IconButton, IconLink } from './menuIcons'
import SearchBar from './SearchBar'
import GroupHeader from './GroupHeader'
import SubgroupHeader from './SubgroupHeader'

const PolyhedronLink = ({ name }) => {
  const styles = StyleSheet.create({
    link: {
      ...resetLink,
      ...hover,
      display: 'block',
      padding: '3px 14px',

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
    >
      {_.capitalize(name)}
    </Link>
  )
}

const PolyhedronList = ({ polyhedra }) => {
  return (
    <ul>
      {polyhedra.map(name => (
        <li key={name}>
          <PolyhedronLink name={name} />
        </li>
      ))}
    </ul>
  )
}

const Subgroup = ({ name, polyhedra }) => {
  const styles = StyleSheet.create({
    subgroup: {
      margin: '18px 0',
    },

    header: {
      margin: '3px 12px',
    },
  })

  return (
    <div className={css(styles.subgroup)}>
      <SubgroupHeader name={name} styles={styles.header} />
      <PolyhedronList polyhedra={polyhedra} />
    </div>
  )
}

const PolyhedronGroup = ({ group }) => {
  const { display, polyhedra, groups } = group
  const styles = StyleSheet.create({
    group: {
      padding: '10px 0',
    },

    header: {
      margin: '5px 12px',
    },
  })

  return (
    <div className={css(styles.group)}>
      <GroupHeader text={display} styles={styles.header} />
      {polyhedra && <PolyhedronList polyhedra={polyhedra} />}
      {groups && (
        <div className={css(styles.subgroups)}>
          {groups.map(group => <Subgroup key={group.name} {...group} />)}
        </div>
      )}
    </div>
  )
}

const Sidebar = ({ groups, width }) => {
  const styles = StyleSheet.create({
    sidebar: {
      height: '100%',
      overflowY: 'scroll',
      backgroundColor: 'WhiteSmoke',
      boxShadow: 'inset -1px -1px 4px LightGray',
    },
  })

  return (
    <section className={css(styles.sidebar)}>
      <div>
        <IconButton name="info" />
        <IconButton name="list" />
        <IconButton name="link" />
        <IconButton name="cog" />
        <IconLink to="/" name="home" />
      </div>
      <SearchBar />
      {groups.map(({ name, ...group }) => (
        <PolyhedronGroup key={name} group={group} />
      ))}
    </section>
  )
}

const mapStateToProps = createStructuredSelector({
  groups: getFilteredGroups,
})

export default connect(mapStateToProps)(Sidebar)
