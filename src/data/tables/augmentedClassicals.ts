import { range } from "lodash-es"
import Table from "./Table"
import {
  FieldOptions,
  ZeroCount,
  AlignOpts,
  bools,
  zeroCounts,
  alignOpts,
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

const countMapping: Record<Base, ZeroCount> = {
  tetrahedron: 1,
  cube: 2,
  dodecahedron: 3,
}

function getCounts(base: Base) {
  return range(countMapping[base] + 1) as ZeroCount[]
}

function* getItems() {
  for (const base of options.base) {
    for (const truncated of options.truncated) {
      for (const count of getCounts(base)) {
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
