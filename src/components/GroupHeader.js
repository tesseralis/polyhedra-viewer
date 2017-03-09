import React from 'react'
import { StyleSheet, css } from 'aphrodite/no-important'
import { hoeflerText } from '../styles/fonts'

const groupDisplays = {
  platonic: 'Platonic Solids',
  archimedean: 'Archimedean Solids',
  prisms: 'Prisms',
  antiprisms: 'Antiprisms',
  johnson: 'Johnson Solids',
}

const styles = StyleSheet.create({
  groupHeader: { fontFamily: hoeflerText, fontSize: 22 }
})

const GroupHeader = ({ name, ...props }) => {
  return <h2 className={css(styles.groupHeader, props.styles)}>
    { groupDisplays[name] || 'Unknown Group' }
  </h2>
}

export default GroupHeader
