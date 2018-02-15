import React from 'react'
import Tooltip from 'rc-tooltip'
import 'rc-tooltip/assets/bootstrap.css'

// Wrapper/Adapter around React Components Tooltip
export default function({ trigger = ['hover'], children, content }) {
  return (
    <Tooltip
      placement="bottom"
      overlay={<div>{content}</div>}
      trigger={trigger}
    >
      {children}
    </Tooltip>
  )
}
