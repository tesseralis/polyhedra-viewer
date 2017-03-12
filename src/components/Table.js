import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { Link } from 'react-router'

import { escapeName } from '../constants/polyhedra'
import Title from './Title'
import GroupHeader from './GroupHeader'
import SubgroupHeader from './SubgroupHeader'

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
      borderRadius: 25,
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
  const maxThumbnailsPerLine = 8
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
  const styles = StyleSheet.create({
    subgroup: {
      margin: '18px 14px',
    },
  })

  return (
    <div className={css(styles.subgroup)}>
      <SubgroupHeader name={name} />
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
      margin: '5px 0',
    },
    
    description: {
      fontFamily: hoeflerText,
      color: 'DimGrey',
      margin: 14,
      lineHeight: '22px',
    },

    subgroups: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    }
  })

  return (
    <div className={css(styles.group)}>
      <GroupHeader name={name} styles={styles.header} />
      <p className={css(styles.description)}>{description}</p>
      { polyhedra && <PolyhedronList polyhedra={polyhedra} /> }
      { groups && <div className={css(styles.subgroups)}>{groups.map(group => <Subgroup key={group.name} {...group} />)}</div> }
    </div>
  )
}

const Table = ({ groups, searchBar: SearchBar }) => {
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
      <Title name="Polyhedra Viewer" />
      <SearchBar />
      { groups.map(group => <PolyhedronGroup key={group.name} {...group} />) }
    </div>
  )
}

export default Table
