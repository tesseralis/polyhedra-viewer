import Table from "./Table"
import { polygonPrefixes, polygons, Polygon } from "../polygons"
import { FieldOptions, PrismType, prismTypes } from "./tableHelpers"

interface Item {
  n: Polygon
  type: PrismType
}

const options: FieldOptions<Item> = {
  n: polygons,
  type: prismTypes,
}

function* getItems() {
  for (const n of options.n) {
    for (const type of options.type) {
      yield { n, type }
    }
  }
}

export default new Table({
  items: getItems(),
  options,
  getName: ({ n, type }) => `${polygonPrefixes.get(n)} ${type}`,
})
