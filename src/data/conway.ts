import { bimap } from "utils"
import { allSolidNames, getPolyhedraNames } from "./common"
import visitTables from "./tables/visitTables"

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

function getConwayNotation(name: string) {
  return visitTables(name, {
    classicals({ family, facet, operation }) {
      return operationMapping[operation] + familyMapping[family](facet)
    },
    prisms({ base, type }) {
      return type[0].toUpperCase() + base
    },
    default() {
      const index = johnsonSolids.indexOf(name)
      return "J" + (index + 1)
    },
  })
}

const conwayMapping = bimap<string, string>(
  Object.fromEntries(
    allSolidNames.map((name) => [name, getConwayNotation(name)]),
  ),
)

export function toConwayNotation(name: string) {
  return conwayMapping.get(name)
}

export function isConwayNotation(symbol: string) {
  return conwayMapping.hasValue(symbol)
}

export function fromConwayNotation(symbol: string) {
  return conwayMapping.of(symbol)
}
