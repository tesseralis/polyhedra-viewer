import React from 'react'
import { Link } from 'react-router-dom'
import { css, StyleSheet } from 'aphrodite/no-important'

import Icon from './Icon'
import { transition, resetButton, resetLink } from 'styles/common'

const styles = StyleSheet.create({
  button: resetButton,
  link: resetLink,
  icon: {
    ...transition('color', 0.25),
    padding: 10,
    color: 'Gray',
    ':hover': {
      color: 'DimGray',
    },
    ':focus': {
      outline: 'none',
      color: 'DarkSlateGray',
    },
  },
})

export const IconButton = ({ name, onClick }) => (
  <button onClick={onClick} className={css(styles.button, styles.icon)}>
    <Icon name={name} size={36} />
  </button>
)

export const IconLink = ({ name, to, replace }) => (
  <Link to={to} replace={replace} className={css(styles.link, styles.icon)}>
    <Icon name={name} size={36} />
  </Link>
)
