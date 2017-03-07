import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router';
import { escapeName } from './util';
import GroupHeader from './components/GroupHeader';
import { groups } from './data';
import { css } from 'aphrodite/no-important';
import commonStyles from './styles/common';
import styles from './SidebarStyles';

const Sidebar = () => {
  return (
    <section className={css(styles.content)}>
      { groups.map(group => (
        <div className={css(styles.group)} key={group.name}>
          <div className={css(styles.groupHeader)}>
            <GroupHeader name={group.name} />
          </div>
          <ul>{
            group.polyhedra.map(polyhedronName => (
              <li key={polyhedronName}>
                <Link
                  to={escapeName(polyhedronName)}
                  className={css(styles.link, commonStyles.hover)}
                  activeClassName={css(styles.isActive)}
                >{_.capitalize(polyhedronName)}</Link>
              </li>
            ))
          }</ul>
        </div>
      )) }
    </section>
  );
}

export default Sidebar
