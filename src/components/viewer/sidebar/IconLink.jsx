import React from 'react';
import { Route, NavLink } from 'react-router-dom';
import { css, StyleSheet } from 'aphrodite/no-important';

import Icon from './Icon';
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
    color: 'Gray',
  },
  title: {
    marginTop: 5,
    fontSize: 12,
    // TODO come up with a better one
    fontFamily: 'system-ui',
  },
});

export default function IconLink({ iconName, title, to, replace, exact }) {
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
