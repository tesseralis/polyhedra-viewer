import Table from "./Table"
import {
  FieldOptions,
  ZeroCount,
  AlignOpts,
  bools,
  zeroCounts,
  alignOpts,
  limitCount,
  countString,
  wordJoin,
  prefix,
} from "./tableHelpers"

type Base = 3 | 4 | 5
interface Item {
  base: Base
  truncated: boolean
  count: ZeroCount
  align?: AlignOpts
}

const options: FieldOptions<Item> = {
  base: [3, 4, 5],
  truncated: bools,
  count: zeroCounts,
  align: alignOpts,
}

function* getItems() {
  for (const base of options.base) {
    for (const truncated of options.truncated) {
      for (const count of limitCount(options.count, base - 2)) {
        if (base === 5 && count === 2) {
          for (const align of alignOpts) {
            yield { base, truncated, count, align }
          }
        } else {
          yield { base, truncated, count }
        }
      }
    }
  }
}

const baseNames: Record<Base, string> = {
  3: "tetrahedron",
  4: "cube",
  5: "dodecahedron",
}

export default new Table({
  items: getItems(),
  options,
  getName({ base, truncated, count, align }) {
    return prefix(
      align,
      wordJoin(
        countString(count, "augmented"),
        truncated ? "truncated" : "",
        baseNames[base],
      ),
    )
  },
})
