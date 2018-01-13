import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

import Icon from './Icon'

const styles = StyleSheet.create({
  link: {
    color: 'Black',
  },
})

export default function IconLink({ to, ...props }) {
  return (
    <a target="_blank" href={to} className={css(styles.link, props.styles)}>
      <Icon {...props} />
    </a>
  )
}
