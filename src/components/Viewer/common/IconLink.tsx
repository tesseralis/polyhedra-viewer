import React from 'react'
import { Route, NavLink, NavLinkProps } from 'react-router-dom'
import { useStyle, scales } from 'styles'
import Icon from '@mdi/react'

import { media, fonts } from 'styles'
import { SrOnly } from 'components/common'
import { colorFill, flexColumn } from 'styles/common'

interface Props extends NavLinkProps {
  iconName: string
  iconOnly?: boolean
  title: string
}

function LinkText({ text, hidden }: { text: string; hidden: boolean }) {
  const css = useStyle({
    marginTop: scales.spacing[1],
    fontSize: scales.font[7],
    fontFamily: fonts.verdana,

    [media.mobileLandscape]: {
      marginTop: 0,
      paddingLeft: scales.spacing[1],
    },
  })
  return hidden ? <SrOnly>{text}</SrOnly> : <div {...css()}>{text}</div>
}

export default function IconLink({
  iconName,
  title,
  to,
  replace,
  exact,
  onClick,
  iconOnly = false,
}: Props) {
  const css = useStyle({
    ...flexColumn('center'),
    ...colorFill('DimGray'),
    textDecoration: 'none',
    padding: scales.spacing[2],

    [media.mobileLandscape]: {
      padding: 0,
      flexDirection: 'row',
    },
  })

  const activeCss = useStyle(colorFill('DarkSlateGray'))

  return (
    <Route>
      <NavLink
        to={to}
        replace={replace}
        exact={exact}
        {...css()}
        {...activeCss('activeClassName')}
        onClick={onClick}
      >
        <Icon path={iconName} size={scales.size[2]} />
        <LinkText text={title} hidden={iconOnly} />
      </NavLink>
    </Route>
  )
}
