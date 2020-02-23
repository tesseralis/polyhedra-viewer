import { bimap } from "utils"

export type PolygonMap<T> = { [n: number]: T }

export const polygonNames = bimap({
  3: "triangle",
  4: "square",
  5: "pentagon",
  6: "hexagon",
  8: "octagon",
  10: "decagon",
})

export const polygonPrefixes = bimap({
  2: "digonal",
  3: "triangular",
  4: "square",
  5: "pentagonal",
  6: "hexagonal",
  8: "octagonal",
  10: "decagonal",
})

const polygons = polygonNames.keys()
export default polygons
