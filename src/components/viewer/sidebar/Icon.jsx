import React from 'react'
import _ from 'lodash'
import 'mdi/css/materialdesignicons.min.css'

const Icon = ({ name, size }) => {
  const classes = _.compact(['mdi', `mdi-${name}`, size && `mdi-${size}px`])

  return <i className={classes.join(' ')} aria-hidden="true" />
}

export default Icon
