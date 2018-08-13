// @flow strict
import React from 'react';
import { Route, NavLink } from 'react-router-dom';
import { makeStyles } from 'styles';

import { resetLink } from 'styles/common';
import { media, fonts } from 'styles';
import { Icon, SrOnly } from 'components/common';

const styles = makeStyles({
  // TODO link hover
  link: {
    ...resetLink,
    display: 'flex',
    alignItems: 'center',
    color: 'DimGray',
    padding: 10,
    flexDirection: 'column',
    [media.mobileLandscape]: {
      padding: 0,
      flexDirection: 'row',
    },
  },
  activeLink: {
    color: 'DarkSlateGray',
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

interface Props {
  iconName: string;
  iconOnly?: boolean;
  title: string;
  to: *; // should be string | LocationShape but gets weird
  replace?: boolean;
  exact?: boolean;
  onClick?: () => void;
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
        <Icon name={iconName} size={36} />
        {iconOnly ? (
          <SrOnly>{title || iconName}</SrOnly>
        ) : (
          <div className={styles('title')}>{title || iconName}</div>
        )}
      </NavLink>
    </Route>
  );
}
