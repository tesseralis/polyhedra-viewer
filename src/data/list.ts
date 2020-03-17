import { getPolyhedraNames } from "."
import johnsonSubgroups from "./johnsonSubgroups"

const groupData = [
  { name: "platonic", display: "Platonic Solids" },
  { name: "archimedean", display: "Archimedean Solids" },
  { name: "prisms", display: "Prisms" },
  { name: "antiprisms", display: "Antiprisms" },
  { name: "johnson", display: "Johnson Solids" },
]

const getEndIndex = (i: number) =>
  i === johnsonSubgroups.length - 1 ? 92 : johnsonSubgroups[i + 1].index

const getJohnsonPolyhedra = () => {
  return johnsonSubgroups.map(({ name, index }, i) => ({
    name,
    polyhedra: getPolyhedraNames("johnson").slice(index, getEndIndex(i)),
  }))
}

const getNestedPolyhedra = (groupName: string) => {
  if (groupName === "johnson") return { groups: getJohnsonPolyhedra() }
  return { polyhedra: getPolyhedraNames(groupName) }
}

export const groups = groupData.map(group => ({
  ...group,
  ...getNestedPolyhedra(group.name),
}))
