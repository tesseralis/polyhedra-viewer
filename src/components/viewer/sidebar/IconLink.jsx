// @flow strict
import React from 'react';
import { Route, NavLink } from 'react-router-dom';
import { css, StyleSheet } from 'aphrodite/no-important';

import { verdana } from 'styles/fonts';
import { Icon } from 'components/common';
import { resetButton, resetLink } from 'styles/common';

const styles = StyleSheet.create({
  button: resetButton,
  link: {
    ...resetLink,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  activeLink: {
    color: 'DarkSlateGray',
  },
  icon: {
    padding: 10,
    color: 'DimGray',
  },
  title: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: verdana,
  },
});

interface Props {
  iconName: string;
  title: string;
  to: string;
  replace?: boolean;
  exact?: boolean;
}

export default function IconLink({
  iconName,
  title,
  to,
  replace,
  exact,
}: Props) {
  return (
    <Route>
      <NavLink
        to={to}
        replace={replace}
        exact={exact}
        className={css(styles.link, styles.icon)}
        activeClassName={css(styles.activeLink)}
      >
        <Icon name={iconName} size={36} />
        <div className={css(styles.title)}>{title || iconName}</div>
      </NavLink>
    </Route>
  );
}
