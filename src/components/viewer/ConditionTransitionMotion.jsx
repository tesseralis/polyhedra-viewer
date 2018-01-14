import React from 'react'
import { TransitionMotion } from 'react-motion'

export default function ConditionTransitionMotion({
  condition,
  style,
  children,
  ...props
}) {
  const styles = condition ? [{ key: 'single', style }] : []

  return (
    <TransitionMotion styles={styles} {...props}>
      {interpolatedStyles => (
        <div>
          {interpolatedStyles.map(({ key, style }) => {
            return <div key={key}>{children(style)}</div>
          })}
        </div>
      )}
    </TransitionMotion>
  )
}
