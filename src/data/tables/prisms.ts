import Table from "./Table"
import { polygonPrefixes, polygons, Polygon } from "../polygons"
import { PrismType, prismTypes } from "./tableHelpers"

interface Item {
  n: Polygon
  type: PrismType
}

function* getItems() {
  for (const n of polygons) {
    for (const type of prismTypes) {
      yield { n, type }
    }
  }
}

function name({ n, type }: Item) {
  return `${polygonPrefixes.get(n)} ${type}`
}

export default new Table(getItems(), name)
