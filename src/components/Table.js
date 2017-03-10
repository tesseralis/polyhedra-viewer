import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { Link } from 'react-router'

import { escapeName } from '../util'
import GroupHeader from './GroupHeader'

import { hoeflerText, andaleMono } from '../styles/fonts'
import { fadeIn } from '../styles/animations'
import { hover } from '../styles/common'

// TODO don't hardcode this?
const thumbnailSize = 100

const PolyhedronLink = ({ name }) => {
  const styles = StyleSheet.create({
    link: {
      ...hover,
      width: thumbnailSize,
      height: thumbnailSize,
      display: 'flex',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    
    image: {
      height: thumbnailSize,
    },
  })
  const escapedName = escapeName(name)
  const img = require(`../images/${escapedName}.png`)
  return (
    <Link to={'/' + escapedName} className={css(styles.link)}>
      <img className={css(styles.image)} src={img} alt={name}></img>
    </Link>
  )
}

const PolyhedronList = ({ polyhedra }) => {
  const maxThumbnailsPerLine = 7
  const styles = StyleSheet.create({
    list: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      maxWidth: maxThumbnailsPerLine * thumbnailSize,
      margin: 'auto',
    },
  })

  return (
    <div className={css(styles.list)}>
      { polyhedra.map(name => <PolyhedronLink key={name} name={name} />) }
    </div>
  )
}

const PolyhedronGroup = ({ name, description, polyhedra }) => {
  const styles = StyleSheet.create({
    group: {
      margin: 18,
      maxWidth: 1000,
    },
    
    header: {
      margin: '5px 0', // TODO figure out another notation for this?
    },
    
    description: {
      fontFamily: hoeflerText,
      color: 'DimGrey',
      margin: 14,
      lineHeight: '22px',
    },
  })

  return (
    <div className={css(styles.group)}>
      <GroupHeader name={name} styles={styles.header} />
      <p className={css(styles.description)}>{description}</p>
      <PolyhedronList polyhedra={polyhedra} />
    </div>
  )
}

const Table = ({ groups, setFilterText }) => {
  const styles = StyleSheet.create({
    table: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
  
      animationName: fadeIn,
      animationDuration: '1s',
    },
  
    title: {
      padding: 32,
      fontFamily: andaleMono,
      fontSize: 36,
      fontWeight: 'bold',
    },
  })

  // FIXME factor out the search input
  return (
    <div className={css(styles.table)}>
      <h1 className={css(styles.title)}>Polyhedra Viewer</h1>
      <label>Search:<input type="text" onChange={e => setFilterText(e.target.value)} /></label>
      { groups.map(group => <PolyhedronGroup key={group.name} {...group} />) }
    </div>
  )
}

export default Table
