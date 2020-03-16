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

function* getItems() {
  for (const gyrate of options.gyrate) {
    for (const diminished of limitCount(options.diminished, 3 - gyrate)) {
      if (gyrate + diminished === 2) {
        for (const align of options.align) {
          yield { gyrate, diminished, align }
        }
      } else {
        yield { gyrate, diminished }
      }
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
