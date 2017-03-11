import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import Icon from './Icon'

// TODO generalize for more icons
const BigIcon = ({ name }) => {
  const styles = StyleSheet.create({
    wrapper: {
      padding: 10,
      color: 'Gray',
      ':hover': { color: 'DimGray' },
    }
  })

  return (
    <div className={css(styles.wrapper)}>
      <Icon name={name} size={4} />
    </div>
  )
}

export default BigIcon
