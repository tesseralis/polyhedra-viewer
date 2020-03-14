import { capitalize } from "lodash-es"

import React, { useState } from "react"
import { NavLink, Route } from "react-router-dom"
import { fonts, useStyle, scales } from "styles"

import { groups } from "data"
import { escapeName } from "data/names"
import { hover, padding, paddingVert, margin, marginVert } from "styles/common"

import SearchBar from "./SearchBar"

function getFilteredPolyhedra(polyhedra: string[], filter: string) {
  return polyhedra.filter(solid => solid.includes(filter.toLowerCase()))
}

function filterGroups(groups: any[], filterText: string): any {
  return groups
    .map(group => {
      if (group.groups) {
        return {
          ...group,
          groups: filterGroups(group.groups, filterText),
        }
      }
      return {
        ...group,
        polyhedra: getFilteredPolyhedra(group.polyhedra, filterText),
      }
    })
    .filter(
      ({ groups, polyhedra }) =>
        (groups && groups.length > 0) || (polyhedra && polyhedra.length > 0),
    )
}

function PolyhedronLink({ name }: { name: string }) {
  const css = useStyle({
    ...hover,
    ...padding(scales.spacing[1], scales.spacing[3]),
    textDecoration: "none",
    display: "block",

    color: "DimGrey",
    lineHeight: 1.25,
    fontFamily: fonts.andaleMono,
    fontSize: scales.font[6],
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  })

  const activeCss = useStyle({
    color: "DarkSlateGray",
    fontWeight: "bolder",
  })

  return (
    <Route>
      <NavLink
        to={`/${escapeName(name)}/list`}
        {...css()}
        {...activeCss("activeClassName")}
      >
        {capitalize(name)}
      </NavLink>
    </Route>
  )
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
  )
}

function SubgroupHeader({ name }: { name: string }) {
  const css = useStyle({
    ...margin(scales.spacing[1], scales.spacing[3]),
    fontFamily: fonts.times,
    fontSize: scales.font[5],
  })
  return <h3 {...css()}>{capitalize(name)}</h3>
}

const Subgroup = ({
  name,
  polyhedra,
}: {
  name: string
  polyhedra: string[]
}) => {
  const css = useStyle(marginVert(scales.spacing[3]))

  return (
    <div {...css()}>
      <SubgroupHeader name={name} />
      <SubList polyhedra={polyhedra} />
    </div>
  )
}

function GroupHeader({ text }: { text: string }) {
  const css = useStyle({
    ...margin(scales.spacing[1], scales.spacing[3]),
    fontFamily: fonts.times,
    fontSize: scales.font[4],
  })
  return <h2 {...css()}>{text}</h2>
}

const PolyhedronGroup = ({ group }: { group: any }) => {
  const { display, polyhedra, groups } = group
  const css = useStyle({ marginTop: scales.spacing[2] })

  return (
    <div {...css()}>
      <GroupHeader text={display} />
      {polyhedra && <SubList polyhedra={polyhedra} />}
      {groups &&
        groups.map((group: any) => <Subgroup key={group.name} {...group} />)}
    </div>
  )
}

export default function ListPanel() {
  const [filterText, setFilterText] = useState("")
  const filteredGroups =
    filterText === "" ? groups : filterGroups(groups, filterText)

  const css = useStyle(paddingVert(scales.spacing[2]))

  return (
    <section {...css()}>
      <SearchBar value={filterText} onChange={setFilterText} />
      {filteredGroups.map(({ name, ...group }: any) => (
        <PolyhedronGroup key={name} group={group} />
      ))}
    </section>
  )
}
