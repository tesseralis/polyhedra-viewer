import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { Link } from 'react-router'

import { escapeName } from '../constants/polyhedra'
import Title from './Title'
import GroupHeader from './GroupHeader'

import { hoeflerText } from '../styles/fonts'
import { fadeIn } from '../styles/animations'
import { hover } from '../styles/common'

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

const Subgroup = ({ name, polyhedra }) => {
  return (
    <div>
      <h3>{name}</h3>
      <PolyhedronList polyhedra={polyhedra} />
    </div>
  )
}

const PolyhedronGroup = ({ name, description, polyhedra, groups }) => {
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
      { polyhedra && <PolyhedronList polyhedra={polyhedra} /> }
      { groups && groups.map(group => <Subgroup key={group.name} {...group} />) }
    </div>
  )
}

const Table = ({ groups, searchBar: SearchBar }) => {
  console.log(groups)
  const styles = StyleSheet.create({
    table: {
      maxWidth: 900,
      margin: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
  
      animationName: fadeIn,
      animationDuration: '1s',
    },
  })

  return (
    <div className={css(styles.table)}>
      <Title>Polyhedra Viewer</Title>
      <SearchBar />
      { groups.map(group => <PolyhedronGroup key={group.name} {...group} />) }
    </div>
  )
}

export default Table
