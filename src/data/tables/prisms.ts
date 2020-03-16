import Table from "./Table"
import { polygonPrefixes, polygons, Polygon } from "../polygons"
import { FieldOptions, PrismType, prismTypes } from "./tableHelpers"

interface Item {
  base: Polygon
  type: PrismType
}

const options: FieldOptions<Item> = {
  base: polygons,
  type: prismTypes,
}

function* getItems() {
  for (const base of options.base) {
    for (const type of options.type) {
      yield { base, type }
    }
  }
}

export default new Table({
  items: getItems(),
  options,
  getName: ({ base, type }) => `${polygonPrefixes.get(base)} ${type}`,
})
