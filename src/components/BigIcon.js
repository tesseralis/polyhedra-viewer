import React from 'react'

// TODO generalize for more icons
const BigIcon = ({ name }) => {
  const className = `fa fa-${name} fa-4x`
  return (
    <i className={className} aria-hidden="true"></i>
  )
}

export default BigIcon
