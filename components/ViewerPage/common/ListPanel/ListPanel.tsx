import { capitalize } from "lodash-es"

import React, { useState } from "react"
import Link from "next/link"
import { fonts, useStyle, scales } from "styles"

import { PolyhedronGroup, PolyhedronSubgroup, groups } from "data/list"
import { escape } from "lib/utils"
import { hover, padding, paddingVert, margin, marginVert } from "styles/common"

import SearchBar from "./SearchBar"

function getFilteredPolyhedra(polyhedra: string[], filter: string) {
  return polyhedra.filter((solid) => solid.includes(filter.toLowerCase()))
}

function filterSubgroups(subgroups: PolyhedronSubgroup[], filterText: string) {
  return subgroups
    .map(({ name, polyhedra }) => ({
      name,
      polyhedra: getFilteredPolyhedra(polyhedra, filterText),
    }))
    .filter(({ polyhedra }) => polyhedra.length > 0)
}

function filterGroups(groups: PolyhedronGroup[], filterText: string) {
  return groups
    .map(({ name, groups }) => ({
      name,
      groups: filterSubgroups(groups, filterText),
    }))
    .filter(({ groups }) => groups.length > 0)
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
  } as any)

  const activeCss = useStyle({
    color: "DarkSlateGray",
    fontWeight: "bolder",
  })

  return (
    <Link href={`/${escape(name)}/list`} passHref>
      <a {...css()} {...activeCss("activeClassName")}>
        {capitalize(name)}
      </a>
    </Link>
  )
}

function SubList({ polyhedra }: { polyhedra: string[] }) {
  return (
    <ul>
      {polyhedra.map((name) => (
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
  } as any)
  return <h3 {...css()}>{capitalize(name)}</h3>
}

function Subgroup({ name, polyhedra }: PolyhedronSubgroup) {
  const css = useStyle(marginVert(scales.spacing[3]) as any)

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
  } as any)
  return <h2 {...css()}>{text}</h2>
}

function Group({ group }: { group: PolyhedronGroup }) {
  const { name, groups } = group
  const css = useStyle({ marginTop: scales.spacing[2] })

  return (
    <div {...css()}>
      <GroupHeader text={name} />
      {groups.map((group) => (
        <Subgroup key={group.name} {...group} />
      ))}
    </div>
  )
}

export default function ListPanel() {
  const [filterText, setFilterText] = useState("")
  const filteredGroups =
    filterText === "" ? groups : filterGroups(groups, filterText)

  const css = useStyle(paddingVert(scales.spacing[2]) as any)

  return (
    <section {...css()}>
      <SearchBar value={filterText} onChange={setFilterText} />
      {filteredGroups.map((group) => (
        <Group key={group.name} group={group} />
      ))}
    </section>
  )
}
