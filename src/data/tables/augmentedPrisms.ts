import { polygonPrefixes } from "../polygons"
import Table from "./Table"
import {
  FieldOptions,
  ZeroCount,
  AlignOpts,
  alignOpts,
  zeroCounts,
  limitCount,
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

const countLimit: Record<FaceType, ZeroCount> = {
  3: 3,
  4: 2,
  5: 2,
  6: 3,
}

function* getItems() {
  for (const base of options.base) {
    for (const count of limitCount(options.count, countLimit[base])) {
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
