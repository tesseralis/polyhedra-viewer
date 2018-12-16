import _ from 'lodash';

import React, { useState } from 'react';
import { NavLink, Route } from 'react-router-dom';
import { fonts, useStyle, fontSizes, spacing } from 'styles';

import { groups } from 'data';
import { escapeName } from 'math/polyhedra/names';
import { hover, padding, paddingVert } from 'styles/common';

import SearchBar from './SearchBar';

function getFilteredPolyhedra(polyhedra: string[], filter: string) {
  return polyhedra.filter(solid => solid.includes(filter.toLowerCase()));
}

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

function PolyhedronLink({ name }: { name: string }) {
  const css = useStyle({
    ...hover,
    ...padding(spacing.s1, spacing.s3),
    textDecoration: 'none',
    display: 'block',
    height: 24,

    color: 'DimGrey',
    lineHeight: '18px',
    fontFamily: fonts.andaleMono,
    fontSize: fontSizes.f6,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  });

  const activeCss = useStyle({
    color: 'DarkSlateGray',
    fontWeight: 'bolder',
  });

  return (
    <Route>
      <NavLink
        to={`/${escapeName(name)}/list`}
        {...css()}
        {...activeCss('activeClassName')}
      >
        {_.capitalize(name)}
      </NavLink>
    </Route>
  );
}

function SubList({ polyhedra }: { polyhedra: string[] }) {
  return (
    <ul>
      {polyhedra.map(name => (
        <li key={name}>
          <PolyhedronLink name={name} />
        </li>
      ))}
    </ul>
  );
}

function SubgroupHeader({ name }: { name: string }) {
  const css = useStyle({
    fontFamily: fonts.times,
    fontSize: fontSizes.f5,
    margin: '3px 12px',
  });
  return <h3 {...css()}>{_.capitalize(name)}</h3>;
}

const Subgroup = ({
  name,
  polyhedra,
}: {
  name: string;
  polyhedra: string[];
}) => {
  const css = useStyle({
    margin: '18px 0',
  });

  return (
    <div {...css()}>
      <SubgroupHeader name={name} />
      <SubList polyhedra={polyhedra} />
    </div>
  );
};

function GroupHeader({ text }: { text: string }) {
  const css = useStyle({
    fontFamily: fonts.times,
    fontSize: fontSizes.f4,
    margin: '5px 12px',
  });
  return <h2 {...css()}>{text}</h2>;
}

const PolyhedronGroup = ({ group }: { group: any }) => {
  const { display, polyhedra, groups } = group;
  const css = useStyle({ paddingTop: spacing.s3 });

  return (
    <div {...css()}>
      <GroupHeader text={display} />
      {polyhedra && <SubList polyhedra={polyhedra} />}
      {groups &&
        groups.map((group: any) => <Subgroup key={group.name} {...group} />)}
    </div>
  );
};

export default function ListPanel() {
  const [filterText, setFilterText] = useState('');
  const filteredGroups =
    filterText === '' ? groups : filterGroups(groups, filterText);

  const css = useStyle(paddingVert(spacing.s2));

  return (
    <section {...css()}>
      <SearchBar value={filterText} onChange={setFilterText} />
      {filteredGroups.map(({ name, ...group }: any) => (
        <PolyhedronGroup key={name} group={group} />
      ))}
    </section>
  );
}
