import { range } from "lodash-es"
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

interface Item {
  gyrate: ZeroCount
  diminished: ZeroCount
  align?: AlignOpts
}

const options: FieldOptions<Item> = {
  gyrate: zeroCounts,
  diminished: zeroCounts,
  align: alignOpts,
}

function* getCounts() {
  for (const gyrate of range(4)) {
    for (const diminished of range(4 - gyrate)) {
      yield [gyrate, diminished] as [ZeroCount, ZeroCount]
    }
  }
}

function* getItems() {
  for (const [gyrate, diminished] of getCounts()) {
    if (gyrate + diminished === 2) {
      for (const align of options.align) {
        yield { gyrate, diminished, align }
      }
    } else {
      yield { gyrate, diminished }
    }
  }
}

export default new Table<Item>({
  items: getItems(),
  options,
  getName({ gyrate, diminished, align }) {
    return prefix(
      align,
      wordJoin(
        countString(gyrate, "gyrate"),
        countString(diminished, "diminished"),
        "rhombicosidodecahedron",
      ),
    )
  },
})
