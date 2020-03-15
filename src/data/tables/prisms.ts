import Table from "./Table"
import { polygonPrefixes, polygons, Polygon } from "../polygons"
import { PrismType, prismTypes } from "./tableHelpers"

interface Item {
  n: Polygon
  type: PrismType
}

const items: Item[] = []
for (const n of polygons) {
  for (const type of prismTypes) {
    items.push({ n, type })
  }
}
function name({ n, type }: Item) {
  return `${polygonPrefixes.get(n)} ${type}`
}
export default new Table(items, name)
