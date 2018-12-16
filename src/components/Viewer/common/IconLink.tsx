import React from 'react';
import { Route, NavLink, NavLinkProps } from 'react-router-dom';
import { useStyle, fontSizes, spacing } from 'styles';
import Icon from '@mdi/react';

import { media, fonts } from 'styles';
import { SrOnly } from 'components/common';
import { colorFill, flexColumn } from 'styles/common';

interface Props extends NavLinkProps {
  iconName: string;
  iconOnly?: boolean;
  title: string;
}

function LinkText({ text, hidden }: { text: string; hidden: boolean }) {
  const css = useStyle({
    marginTop: 5,
    fontSize: fontSizes.f7,
    fontFamily: fonts.verdana,

    [media.mobileLandscape]: {
      marginTop: 0,
      paddingLeft: spacing.s1,
    },
  });
  return hidden ? <SrOnly>{text}</SrOnly> : <div {...css()}>{text}</div>;
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

    // FIXME the nav menu looks a little off
    padding: spacing.s2,

    [media.mobileLandscape]: {
      padding: 0,
      flexDirection: 'row',
    },
  });

  const activeCss = useStyle(colorFill('DarkSlateGray'));

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
        <Icon path={iconName} size="36px" />
        <LinkText text={title} hidden={iconOnly} />
      </NavLink>
    </Route>
  );
}
