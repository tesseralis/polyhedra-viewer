import _ from 'lodash';
import React, { Component } from 'react';
import { NavLink, Route } from 'react-router-dom';
import { css, StyleSheet } from 'aphrodite/no-important';

import { groups } from 'data';
import { escapeName } from 'polyhedra/names';
import { andaleMono } from 'styles/fonts';
import { resetLink, hover } from 'styles/common';

import SearchBar from './SearchBar';
import GroupHeader from './GroupHeader';
import SubgroupHeader from './SubgroupHeader';

const getFilteredPolyhedra = (polyhedra, filter) =>
  polyhedra.filter(solid => solid.includes(filter.toLowerCase()));

const filterGroups = (groups, filterText) =>
  groups
    .map(group => {
      if (group.groups) {
        return {
          ...group,
          groups: filterGroups(group.groups, filterText),
        };
      }
      return {
        ...group,
        polyhedra: getFilteredPolyhedra(group.polyhedra, filterText),
      };
    })
    .filter(
      ({ groups, polyhedra }) =>
        (groups && groups.length > 0) || (polyhedra && polyhedra.length > 0),
    );

const PolyhedronLink = ({ name }) => {
  const styles = StyleSheet.create({
    link: {
      ...resetLink,
      ...hover,
      display: 'block',
      padding: '3px 14px',
      height: 24,

      color: 'DimGrey',
      lineHeight: '18px',
      fontFamily: andaleMono,
      fontSize: 14,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    isActive: {
      color: 'DarkSlateGray',
      fontWeight: 'bolder',
    },
  });

  return (
    <Route
      render={({ match }) => (
        <NavLink
          to={`/${escapeName(name)}/list`}
          className={css(styles.link)}
          activeClassName={css(styles.isActive)}
        >
          {_.capitalize(name)}
        </NavLink>
      )}
    />
  );
};

const SubList = ({ polyhedra }) => {
  return (
    <ul>
      {polyhedra.map(name => (
        <li key={name}>
          <PolyhedronLink name={name} />
        </li>
      ))}
    </ul>
  );
};

const Subgroup = ({ name, polyhedra }) => {
  const styles = StyleSheet.create({
    subgroup: {
      margin: '18px 0',
    },

    header: {
      margin: '3px 12px',
    },
  });

  return (
    <div className={css(styles.subgroup)}>
      <SubgroupHeader name={name} styles={styles.header} />
      <SubList polyhedra={polyhedra} />
    </div>
  );
};

const PolyhedronGroup = ({ group }) => {
  const { display, polyhedra, groups } = group;
  const styles = StyleSheet.create({
    group: {
      padding: '10px 0',
    },

    header: {
      margin: '5px 12px',
    },
  });

  return (
    <div className={css(styles.group)}>
      <GroupHeader text={display} styles={styles.header} />
      {polyhedra && <SubList polyhedra={polyhedra} />}
      {groups && (
        <div className={css(styles.subgroups)}>
          {groups.map(group => <Subgroup key={group.name} {...group} />)}
        </div>
      )}
    </div>
  );
};

export default class PolyhedronList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filterText: '',
    };
  }

  render() {
    const { filterText } = this.state;
    return (
      <div>
        <SearchBar text={filterText} onChange={this.handleFilterChange} />
        {filterGroups(groups, filterText).map(({ name, ...group }) => (
          <PolyhedronGroup key={name} group={group} />
        ))}
      </div>
    );
  }

  handleFilterChange = value => {
    this.setState({ filterText: value });
  };
}
