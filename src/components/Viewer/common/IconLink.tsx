import React from 'react';
import { Route, NavLink, NavLinkProps } from 'react-router-dom';
import { makeStyles } from 'styles';
import Icon from '@mdi/react';

import { resetLink } from 'styles/common';
import { media, fonts } from 'styles';
import { SrOnly } from 'components/common';

const styles = makeStyles({
  link: {
    ...resetLink,
    display: 'flex',
    alignItems: 'center',
    color: 'DimGray',
    fill: 'DimGray',
    padding: 10,
    flexDirection: 'column',
    [media.mobileLandscape]: {
      padding: 0,
      flexDirection: 'row',
    },
  },
  activeLink: {
    color: 'DarkSlateGray',
    fill: 'DarkSlateGray',
  },
  title: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: fonts.verdana,

    [media.mobilePortrait]: {
      fontSize: 9,
    },
    [media.mobileLandscape]: {
      marginTop: 0,
      paddingLeft: 5,
    },
  },
});

interface Props extends NavLinkProps {
  iconName: string;
  iconOnly?: boolean;
  title: string;
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
  return (
    <Route>
      <NavLink
        to={to}
        replace={replace}
        exact={exact}
        className={styles('link')}
        activeClassName={styles('activeLink')}
        onClick={onClick}
      >
        <Icon path={iconName} size="36px" />
        {iconOnly ? (
          <SrOnly>{title}</SrOnly>
        ) : (
          <div className={styles('title')}>{title}</div>
        )}
      </NavLink>
    </Route>
  );
}
