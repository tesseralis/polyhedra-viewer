import type Specs from "./PolyhedronSpecs"
import { getPolyhedraNames } from "../common"
const johnsonSolids = getPolyhedraNames("johnson")

const operationMapping = {
  regular: "",
  truncate: "t",
  rectify: "a",
  bevel: "b",
  cantellate: "e",
  snub: "s",
}

const familyMapping = {
  3: () => "T",
  4: (facet: any) => (facet === "vertex" ? "O" : "C"),
  5: (facet: any) => (facet === "vertex" ? "I" : "D"),
}

export default function getConwaySymbol(structure: Specs) {
  if (structure.isClassical()) {
    const { family, facet, operation } = structure.data
    return operationMapping[operation] + familyMapping[family](facet)
  }

  if (structure.isPrismatic()) {
    const { type, base } = structure.data
    return `${type[0].toUpperCase()}${base}`
  }

  const index = johnsonSolids.indexOf(structure.canonicalName())
  return `J${index + 1}`
}
