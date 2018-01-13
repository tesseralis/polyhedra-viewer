import React from 'react'
import _ from 'lodash'
import 'font-awesome/css/font-awesome.css'

const Icon = ({ name, size }) => {
  const classes = _.compact(['fa', `fa-${name}`, size && `fa-${size}x`])

  return <i className={classes.join(' ')} aria-hidden="true" />
}

export default Icon
