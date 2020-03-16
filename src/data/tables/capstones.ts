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
  base: 2 | 3 | 4 | 5
  type: "pyramid" | "cupola" | "rotunda" | "cupolarotunda"
  elongation: "" | PrismType
  count: 1 | 2
  gyrate?: "ortho" | "gyro"
}

const options: FieldOptions<Item> = {
  base: [2, 3, 4, 5],
  type: ["pyramid", "cupola", "rotunda", "cupolarotunda"],
  elongation: ["", ...prismTypes],
  count: [1, 2],
  gyrate: ["ortho", "gyro"],
}

function* getItems(): Generator<Item> {
  for (const base of options.base.slice(1)) {
    for (const type of options.type) {
      // Only pentagonal rotundae exist
      if (["rotunda", "cupolarotunda"].includes(type) && base !== 5) {
        continue
      }
      for (const elongation of options.elongation) {
        // Gyroelongated pyramids are concave
        if (base === 3 && type === "pyramid" && elongation === "antiprism") {
          continue
        }
        for (const count of options.count) {
          // Cupola-rotundae only exist if there are two of them
          if (type === "cupolarotunda" && count !== 2) {
            continue
          }
          // Only cupolae, rotundae can be ortho or gyro
          if (count === 2 && type !== "pyramid" && elongation !== "antiprism") {
            for (const gyrate of options.gyrate) {
              yield {
                base,
                type,
                elongation,
                count,
                gyrate,
              }
            }
          } else {
            yield { base, type, elongation, count }
          }
        }
      }
    }
  }
  yield { base: 2, type: "cupola", elongation: "", count: 1 }
  yield {
    base: 2,
    type: "cupola",
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
  getName({ base, type, elongation, count, gyrate }) {
    const baseStr = type === "cupolarotunda" ? type : countString(count, type)
    return wordJoin(
      elongStr[elongation],
      polygonPrefixes.get(base),
      prefix(gyrate, baseStr),
    )
  },
})
