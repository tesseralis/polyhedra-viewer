import { bimap } from "utils"
import { getPolyhedraNames } from "data/common"
import { polygonPrefixes } from "./polygons"

const johnsonSolids = getPolyhedraNames("johnson")

const platonicMapping = bimap({
  T: "tetrahedron",
  C: "cube",
  O: "octahedron",
  D: "dodecahedron",
  I: "icosahedron",
})

const archimedeanMapping = bimap({
  tT: "truncated tetrahedron",
  aC: "cuboctahedron",
  tC: "truncated cube",
  tO: "truncated octahedron",
  eC: "rhombicuboctahedron",
  bC: "truncated cuboctahedron",
  sC: "snub cube",
  aD: "icosidodecahedron",
  tD: "truncated dodecahedron",
  tI: "truncated icosahedron",
  eD: "rhombicosidodecahedron",
  bD: "truncated icosidodecahedron",
  sD: "snub dodecahedron",
})

export function isConwaySymbol(symbol: string) {
  if (platonicMapping.hasKey(symbol) || archimedeanMapping.hasKey(symbol)) {
    return true
  }
  const prefix = symbol[0]
  const number = parseInt(symbol.substring(1), 10)
  if (prefix === "J" && number >= 0 && number <= 92) {
    return true
  }
  if (["P", "A"].includes(prefix) && polygonPrefixes.hasKey(number)) {
    return true
  }
  return false
}

export const fromConwayNotation = (notation: string) => {
  const prefix = notation[0]
  const number = parseInt(notation.substring(1))
  if (platonicMapping.hasKey(notation)) {
    return platonicMapping.get(notation)
  }
  if (archimedeanMapping.hasKey(notation)) {
    return archimedeanMapping.get(notation)
  }
  if (prefix === "J") {
    return johnsonSolids[number - 1]
  }
  if (prefix === "P" && polygonPrefixes.hasKey(number)) {
    return `${polygonPrefixes.get(number)} prism`
  }
  if (prefix === "A" && polygonPrefixes.hasKey(number)) {
    return `${polygonPrefixes.get(number)} antiprism`
  }
  return ""
}

export const toConwayNotation = (solid: string) => {
  const name = solid
  if (platonicMapping.hasValue(name)) {
    return platonicMapping.of(name)
  }
  if (archimedeanMapping.hasValue(name)) {
    return archimedeanMapping.of(name)
  }
  if (johnsonSolids.includes(name)) {
    return "J" + (johnsonSolids.indexOf(name) + 1)
  }
  const [prefix] = name.split(" ")
  if (name.includes("antiprism") && polygonPrefixes.hasValue(prefix)) {
    return "A" + polygonPrefixes.of(prefix)
  }
  if (name.includes("prism") && polygonPrefixes.hasValue(prefix)) {
    return "P" + polygonPrefixes.of(prefix)
  }
  throw new Error(`Invalid solid name ${solid}`)
}
