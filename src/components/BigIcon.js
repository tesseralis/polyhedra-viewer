import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

// TODO generalize for more icons
const BigIcon = ({ name }) => {
  const styles = StyleSheet.create({
    wrapper: {
      padding: 10,
      color: 'Gray',
      ':hover': { color: 'DimGray' },
    }
  })

  const className = `fa fa-${name} fa-4x`
  return (
    <div className={css(styles.wrapper)}>
      <i className={className} aria-hidden="true" />
    </div>
  )
}

export default BigIcon
