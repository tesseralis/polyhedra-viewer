import { range } from "lodash-es"

import { polygonPrefixes } from "../polygons"
import Table from "./Table"
import {
  FieldOptions,
  ZeroCount,
  AlignOpts,
  alignOpts,
  zeroCounts,
  prefix,
  wordJoin,
  countString,
} from "./tableHelpers"

type FaceType = 3 | 4 | 5 | 6
interface Item {
  base: FaceType
  count: ZeroCount
  align?: AlignOpts
}

const options: FieldOptions<Item> = {
  base: [3, 4, 5, 6],
  count: zeroCounts,
  align: alignOpts,
}

function getCounts(n: FaceType) {
  const limit = [3, 6].includes(n) ? 3 : 2
  return range(limit + 1) as ZeroCount[]
}

function* getItems() {
  for (const base of options.base) {
    for (const count of getCounts(base)) {
      if (base === 6 && count === 2) {
        for (const align of options.align) {
          yield { base, count, align }
        }
      } else {
        yield { base, count }
      }
    }
  }
}

export default new Table({
  items: getItems(),
  options,
  getName({ base, count, align }) {
    return prefix(
      align,
      wordJoin(
        countString(count, "augmented"),
        polygonPrefixes.get(base),
        "prism",
      ),
    )
  },
})
