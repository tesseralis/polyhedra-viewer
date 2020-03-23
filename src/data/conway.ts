import { bimap } from "utils"
import { allSolidNames } from "./common"
import getStructure from "./structure/getStructure"

function getConwayNotation(name: string) {
  return getStructure(name).conwaySymbol()
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
