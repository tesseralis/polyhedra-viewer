import _ from 'lodash'
import React from 'react'
import {
  mdiFormatListBulleted,
  mdiInformationOutline,
  mdiSettings,
  mdiMathCompass,
  mdiCubeOutline,
} from '@mdi/js'

import { useStyle } from 'styles'
import IconLink from './IconLink'

interface Props {
  solid: string
  compact?: boolean
  onClick?: () => void
}

const links = [
  { name: 'list', icon: mdiFormatListBulleted },
  { name: 'info', icon: mdiInformationOutline },
  { name: 'options', icon: mdiSettings },
  { name: 'operations', icon: mdiMathCompass },
  { name: 'full', title: 'Fullscreen', icon: mdiCubeOutline },
]

export default function NavMenu({
  solid,
  compact = false,
  onClick = _.noop,
}: Props) {
  const css = useStyle({
    // Using grid here bc it's easier to get evenly spaced than flex
    display: 'grid',
    gridTemplateColumns: `repeat(${links.length}, 1fr)`,
    justifyItems: 'center',
    width: '100%',
  })

  return (
    <nav {...css()}>
      {links.map(({ name, title = name, icon }) => (
        <IconLink
          key={name}
          replace
          to={`/${solid}/${name}`}
          title={_.capitalize(title)}
          iconName={icon}
          iconOnly={compact}
          onClick={onClick}
        />
      ))}
    </nav>
  )
}
