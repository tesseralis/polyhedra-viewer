import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

import Title from './Title'
import GroupHeader from './GroupHeader'
import SubgroupHeader from './SubgroupHeader'
import IconLink from './IconLink'
import PolyhedronLink from './PolyhedronLink'

import { hoeflerText, andaleMono } from '../styles/fonts'
import { fadeIn } from '../styles/animations'
import { resetLink } from '../styles/common'

const thumbnailSize = 100

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
      {polyhedra.map(name => <PolyhedronLink key={name} name={name} />)}
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

const PolyhedronGroup = ({ group }) => {
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
      margin: '14px 0',
      lineHeight: '22px',
    },

    infoLink: {
      paddingLeft: 3,
      fontSize: 13,
    },

    subgroups: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    },
  })

  const { display, description, infoLink, polyhedra, groups } = group

  return (
    <div className={css(styles.group)}>
      <GroupHeader text={display} styles={styles.header} />
      <p className={css(styles.description)}>
        {description}
        <IconLink to={infoLink} name="wikipedia-w" styles={styles.infoLink} />
      </p>
      {polyhedra && <PolyhedronList polyhedra={polyhedra} />}
      {groups && (
        <div className={css(styles.subgroups)}>
          {groups.map(group => <Subgroup key={group.name} {...group} />)}
        </div>
      )}
    </div>
  )
}

const Header = () => {
  const styles = StyleSheet.create({
    header: {
      padding: 20,
      display: 'flex',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    title: { padding: 14 },
    subtitle: { fontFamily: andaleMono },
    authorLink: { ...resetLink },
    ghLink: { paddingLeft: 5 },
  })
  return (
    <header className={css(styles.header)}>
      <Title name="Polyhedra Viewer" styles={styles.title} />
      <p className={css(styles.subtitle)}>
        by{' '}
        <a
          className={css(styles.authorLink)}
          target="_blank"
          href="http://tessenate.me"
        >
          nfa
        </a>
      </p>
      <IconLink
        name="github"
        to="https://github.com/tessenate/polyhedra-viewer"
        styles={styles.ghLink}
      />
    </header>
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
      <Header />
      <SearchBar />
      {groups.map(({ name, ...group }) => (
        <PolyhedronGroup key={name} group={group} />
      ))}
    </div>
  )
}

export default Table
