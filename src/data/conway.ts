import { BiMap } from "bimap"
import { allSolidNames } from "./common"
import getSpecs from "./specs/getSpecs"

function getConwayNotation(name: string) {
  return getSpecs(name).conwaySymbol()
}

const conwayMapping = new BiMap(
  allSolidNames.map((name) => [name, getConwayNotation(name)]),
)

export function isConwayNotation(symbol: string) {
  return conwayMapping.hasValue(symbol)
}

export function fromConwayNotation(symbol: string) {
  return conwayMapping.of(symbol)
}
