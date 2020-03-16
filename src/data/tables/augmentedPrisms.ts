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
  n: FaceType
  count: ZeroCount
  align?: AlignOpts
}

const options: FieldOptions<Item> = {
  n: [3, 4, 5, 6],
  count: zeroCounts,
  align: alignOpts,
}

function getCounts(n: FaceType) {
  const limit = [3, 6].includes(n) ? 3 : 2
  return range(limit + 1) as ZeroCount[]
}

function* getItems() {
  for (const n of options.n) {
    for (const count of getCounts(n)) {
      if (n === 6 && count === 2) {
        for (const align of options.align) {
          yield { n, count, align }
        }
      } else {
        yield { n, count }
      }
    }
  }
}

export default new Table({
  items: getItems(),
  options,
  getName({ n, count, align }) {
    return prefix(
      align,
      wordJoin(
        countString(count, "augmented"),
        polygonPrefixes.get(n),
        "prism",
      ),
    )
  },
})
