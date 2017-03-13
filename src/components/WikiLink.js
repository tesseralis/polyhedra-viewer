import React from 'react'
import IconLink from './IconLink'
import { StyleSheet } from 'aphrodite/no-important'

// TODO group this information with the JSON data, not here
const groupLinks = {
  platonic: 'http://en.wikipedia.org/wiki/Platonic_solid',
  archimedean: 'http://en.wikipedia.org/wiki/Archimedean_solid',
  prisms: 'http://en.wikipedia.org/wiki/Prism_(geometry)',
  antiprisms: 'http://en.wikipedia.org/wiki/Antiprism',
  johnson: 'http://en.wikipedia.org/wiki/Johnson_solid',
}

const styles = StyleSheet.create({
  link: { fontSize: 13, paddingLeft: 2 }
})

export default function WikiLink({groupName}) {
  return <IconLink to={groupLinks[groupName]} name="wikipedia-w" styles={styles.link} />
}
