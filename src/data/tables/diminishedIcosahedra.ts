import Table from "./Table"
import {
  ZeroCount,
  zeroCounts,
  AlignOpts,
  alignOpts,
  FieldOptions,
  bools,
  prefix,
  wordJoin,
  countString,
} from "./tableHelpers"

interface Item {
  count: ZeroCount
  align?: AlignOpts
  augmented?: boolean
}

const options: FieldOptions<Item> = {
  count: zeroCounts,
  align: alignOpts,
  augmented: bools,
}

function* getItems(): Generator<Item> {
  for (const count of options.count) {
    if (count === 2) {
      for (const align of options.align) {
        yield { count, align }
      }
    } else {
      yield { count }
    }
  }
  yield { count: 3, augmented: true }
}

// TODO in the future, this should track diminished octahedra as well
export default new Table({
  items: getItems(),
  options,
  getName({ count, align, augmented }) {
    return wordJoin(
      augmented ? "augmented" : "",
      prefix(align, countString(count, "diminished")),
      "icosahedron",
    )
  },
})
