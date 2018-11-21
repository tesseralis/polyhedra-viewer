import _ from 'lodash';

import React, { useState } from 'react';
import { NavLink, Route } from 'react-router-dom';
import { makeStyles } from 'styles';

import { groups } from 'data';
import { escapeName } from 'math/polyhedra/names';
import { andaleMono } from 'styles/fonts';
import { resetLink, hover } from 'styles/common';

import SearchBar from './SearchBar';
import GroupHeader from './GroupHeader';
import SubgroupHeader from './SubgroupHeader';

const getFilteredPolyhedra = (polyhedra: string[], filter: string) =>
  polyhedra.filter(solid => solid.includes(filter.toLowerCase()));

function filterGroups(groups: any[], filterText: string): any {
  return groups
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
}

const PolyhedronLink = ({ name }: { name: string }) => {
  const styles = makeStyles({
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
      render={() => (
        <NavLink
          to={`/${escapeName(name)}/list`}
          className={styles('link')}
          activeClassName={styles('isActive')}
        >
          {_.capitalize(name)}
        </NavLink>
      )}
    />
  );
};

const SubList = ({ polyhedra }: { polyhedra: string[] }) => {
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

const Subgroup = ({
  name,
  polyhedra,
}: {
  name: string;
  polyhedra: string[];
}) => {
  const styles = makeStyles({
    subgroup: {
      margin: '18px 0',
    },
  });

  return (
    <div className={styles('subgroup')}>
      <SubgroupHeader name={name} />
      <SubList polyhedra={polyhedra} />
    </div>
  );
};

const PolyhedronGroup = ({ group }: { group: any }) => {
  const { display, polyhedra, groups } = group;
  const styles = makeStyles({
    group: {
      padding: '10px 0',
    },
  });

  return (
    <div className={styles('group')}>
      <GroupHeader text={display} />
      {polyhedra && <SubList polyhedra={polyhedra} />}
      {groups && (
        <div className={styles('subgroups')}>
          {groups.map((group: any) => (
            <Subgroup key={group.name} {...group} />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = makeStyles({
  list: {
    paddingTop: 10,
  },
});

export default function PolyhedronList() {
  const [filterText, setFilterText] = useState('');
  const filteredGroups =
    filterText === '' ? groups : filterGroups(groups, filterText);
  return (
    <section className={styles('list')}>
      <SearchBar value={filterText} onChange={setFilterText} />
      {filteredGroups.map(({ name, ...group }: any) => (
        <PolyhedronGroup key={name} group={group} />
      ))}
    </section>
  );
}
