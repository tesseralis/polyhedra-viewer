import { getPolyhedra, johnsonSolids } from "."
import johnsonSubgroups from "./johnsonSubgroups"
import groupData from "./groups"

const getEndIndex = (i: number) =>
  i === johnsonSubgroups.length - 1 ? 92 : johnsonSubgroups[i + 1].index
const getJohnsonPolyhedra = () => {
  return johnsonSubgroups.map(({ name, index }, i) => ({
    name,
    polyhedra: johnsonSolids.slice(index, getEndIndex(i)),
  }))
}

const getNestedPolyhedra = (groupName: string) => {
  if (groupName === "johnson") return { groups: getJohnsonPolyhedra() }
  return { polyhedra: getPolyhedra(groupName) }
}

export const groups = groupData.map(group => ({
  ...group,
  ...getNestedPolyhedra(group.name),
}))
