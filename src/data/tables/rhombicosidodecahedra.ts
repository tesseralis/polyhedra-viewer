import { range } from "lodash-es"
import Table from "./Table"
import {
  ZeroCount,
  AlignOpts,
  alignOpts,
  prefix,
  wordJoin,
  countString,
} from "./tableHelpers"

interface Item {
  gyrate: ZeroCount
  diminished: ZeroCount
  align?: AlignOpts
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
      for (const align of alignOpts) {
        yield { gyrate, diminished, align }
      }
    } else {
      yield { gyrate, diminished }
    }
  }
}

function name({ gyrate, diminished, align }: Item) {
  return prefix(
    align,
    wordJoin(
      countString(gyrate, "gyrate"),
      countString(diminished, "diminished"),
      "rhombicosidodecahedron",
    ),
  )
}
export default new Table([...getItems()], name)
