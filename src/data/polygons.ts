import { Items } from "types"
import { BiMap } from "bimap"

export type PolygonMap<T> = { [n: number]: T }

export const polygonNames = new BiMap([
  [3, "triangle"],
  [4, "square"],
  [5, "pentagon"],
  [6, "hexagon"],
  [8, "octagon"],
  [10, "decagon"],
] as const)

export const polygonPrefixes = new BiMap([
  [1, "monogonal"],
  [2, "digonal"],
  [3, "triangular"],
  [4, "square"],
  [5, "pentagonal"],
  [6, "hexagonal"],
  [8, "octagonal"],
  [10, "decagonal"],
] as const)

export const primaryPolygons = [3, 4, 5] as const
export type PrimaryPolygon = Items<typeof primaryPolygons>

export const secondaryPolygons = [6, 8, 10] as const
export type SecondaryPolygon = Items<typeof secondaryPolygons>

export const polygons = [...primaryPolygons, ...secondaryPolygons]
export type Polygon = PrimaryPolygon | SecondaryPolygon
