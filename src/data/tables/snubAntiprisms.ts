import { polygonPrefixes } from "../polygons"
import Table from "./Table"
import { FieldOptions } from "./tableHelpers"

interface Item {
  base: 2 | 3 | 4
}

const options: FieldOptions<Item> = {
  base: [2, 3, 4],
}

function* getItems() {
  for (const base of options.base) {
    yield { base }
  }
}

export default new Table({
  items: getItems(),
  options,
  getName: ({ base }) => `snub ${polygonPrefixes.get(base)} antiprism`,
})
