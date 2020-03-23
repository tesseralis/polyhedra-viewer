import type Structure from "./Structure"
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

export default function getConwaySymbol(structure: Structure) {
  return structure.visit({
    exceptional({ family, facet, operation }) {
      return operationMapping[operation] + familyMapping[family](facet)
    },
    prismatic({ base, type }) {
      return type[0].toUpperCase() + base
    },
    default() {
      const index = johnsonSolids.indexOf(structure.canonicalName())
      return "J" + (index + 1)
    },
  })
}
