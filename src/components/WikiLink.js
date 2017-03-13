import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

import Icon from './Icon'

// TODO group this information with the JSON data, not here
const groupLinks = {
  platonic: 'http://en.wikipedia.org/wiki/Platonic_solid',
  archimedean: 'http://en.wikipedia.org/wiki/Archimedean_solid',
  prisms: 'http://en.wikipedia.org/wiki/Prism_(geometry)',
  antiprisms: 'http://en.wikipedia.org/wiki/Antiprism',
  johnson: 'http://en.wikipedia.org/wiki/Johnson_solid',
}

const styles = StyleSheet.create({
  link: {
    color: 'Black',
    fontSize: 13,
    padding: '0 2px',
  },
})

export default function WikiLink({groupName}) {
  return (
    <a target="_blank" href={groupLinks[groupName]} className={css(styles.link)}>
      <Icon name="wikipedia-w" />
    </a>
  )
}
