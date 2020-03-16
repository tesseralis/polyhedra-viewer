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

type Base = "tetrahedron" | "cube" | "dodecahedron"
interface Item {
  base: Base
  truncated: boolean
  count: ZeroCount
  align?: AlignOpts
}

const options: FieldOptions<Item> = {
  base: ["tetrahedron", "cube", "dodecahedron"],
  truncated: bools,
  count: zeroCounts,
  align: alignOpts,
}

const countLimit: Record<Base, ZeroCount> = {
  tetrahedron: 1,
  cube: 2,
  dodecahedron: 3,
}

function* getItems() {
  for (const base of options.base) {
    for (const truncated of options.truncated) {
      for (const count of limitCount(options.count, countLimit[base])) {
        if (base === "dodecahedron" && count === 2) {
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

export default new Table({
  items: getItems(),
  options,
  getName({ base, truncated, count, align }) {
    return prefix(
      align,
      wordJoin(
        countString(count, "augmented"),
        truncated ? "truncated" : "",
        base,
      ),
    )
  },
})
