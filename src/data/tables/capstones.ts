import { polygonPrefixes } from "../polygons"
import Table from "./Table"
import {
  FieldOptions,
  prefix,
  wordJoin,
  countString,
  PrismType,
  prismTypes,
} from "./tableHelpers"

interface Item {
  n: 2 | 3 | 4 | 5
  base: "pyramid" | "cupola" | "rotunda" | "cupolarotunda"
  elongation: "" | PrismType
  count: 1 | 2
  gyrate?: "ortho" | "gyro"
}

const options: FieldOptions<Item> = {
  n: [2, 3, 4, 5],
  base: ["pyramid", "cupola", "rotunda", "cupolarotunda"],
  elongation: ["", ...prismTypes],
  count: [1, 2],
  gyrate: ["ortho", "gyro"],
}

function* getItems(): Generator<Item> {
  for (const n of options.n.slice(1)) {
    for (const base of options.base) {
      // Only pentagonal rotundae exist
      if (["rotunda", "cupolarotunda"].includes(base) && n !== 5) {
        continue
      }
      for (const elongation of options.elongation) {
        // Gyroelongated pyramids are concave
        if (n === 3 && base === "pyramid" && elongation === "antiprism") {
          continue
        }
        for (const count of options.count) {
          // Cupola-rotundae only exist if there are two of them
          if (base === "cupolarotunda" && count !== 2) {
            continue
          }
          // Only cupolae, rotundae can be ortho or gyro
          if (count === 2 && base !== "pyramid" && elongation !== "antiprism") {
            for (const gyrate of options.gyrate) {
              yield {
                n,
                base,
                elongation,
                count,
                gyrate,
              }
            }
          } else {
            yield { n, base, elongation, count }
          }
        }
      }
    }
  }
  yield { n: 2, base: "cupola", elongation: "", count: 1 }
  yield {
    n: 2,
    base: "cupola",
    elongation: "",
    count: 2,
    gyrate: "gyro",
  }
}

const elongStr = {
  prism: "elongated",
  antiprism: "gyroelongated",
  "": "",
}

export default new Table({
  items: getItems(),
  options,
  getName({ n, base, elongation, count, gyrate }) {
    const baseStr = base === "cupolarotunda" ? base : countString(count, base)
    return wordJoin(
      elongStr[elongation],
      polygonPrefixes.get(n),
      prefix(gyrate, baseStr),
    )
  },
})
