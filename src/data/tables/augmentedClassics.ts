import { range } from "lodash-es"
import Table from "./Table"
import {
  Count,
  AlignOpts,
  alignOpts,
  countString,
  wordJoin,
  prefix,
} from "./tableHelpers"

type Base = "tetrahedron" | "cube" | "dodecahedron"
const bases: Base[] = ["tetrahedron", "cube", "dodecahedron"]

interface Item {
  base: Base
  truncated: boolean
  count: Count
  align?: AlignOpts
}

const countMapping: Record<Base, Count> = {
  tetrahedron: 1,
  cube: 2,
  dodecahedron: 3,
}

function getCounts(base: Base) {
  return range(1, countMapping[base] + 1) as Count[]
}

const items: Item[] = []
for (const base of bases) {
  for (const truncated of [false, true]) {
    for (const count of getCounts(base)) {
      if (base === "dodecahedron" && count === 2) {
        for (const align of alignOpts) {
          items.push({ base, truncated, count, align })
        }
      } else {
        items.push({ base, truncated, count })
      }
    }
  }
}

function name({ base, truncated, count, align }: Item) {
  return prefix(
    align,
    wordJoin(
      countString(count, "augmented"),
      truncated ? "truncated" : "",
      base,
    ),
  )
}

export default new Table(items, name)
