import _ from 'lodash';
import React, { Component } from 'react';
import { Link } from 'react-router';
import { escapeName } from './util';
import GroupHeader from './GroupHeader';
import { groups } from './data';
import { css } from 'aphrodite/no-important';
import styles from './SidebarStyles';


export default class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: true
    }
  }

  toggle() {
    this.setState((prevState, props) => ({ visible: !prevState.visible }));
  }

  render() {
    return (
      <div className={css(styles.sidebar)}>
        { this.state.visible && <section className={css(styles.content)}>
          <Link to="/" className={css(styles.homeLink, styles.hover)}>Home</Link>
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
                      className={css(styles.link, styles.hover)}
                      activeClassName={css(styles.isActive)}
                    >{_.capitalize(polyhedronName)}</Link>
                  </li>
                ))
              }</ul>
            </div>
          )) }
        </section> }
        <button
          type="button"
          className={css(styles.toggle)}
          onClick={(e) => this.toggle(e)}
        >⋮</button>
      </div>
    );
  }
};
