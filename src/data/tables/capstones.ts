import { polygonPrefixes } from "../polygons"
import Table from "./Table"
import {
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
  gyrate?: "ortho" | "gyro"
  count: 1 | 2
}
const items: Item[] = []
for (const n of [3, 4, 5]) {
  for (const base of ["pyramid", "cupola", "rotunda", "cupolarotunda"]) {
    // Only pentagonal rotundae exist
    if (["rotunda", "cupolarotunda"].includes(base) && n !== 5) {
      continue
    }
    for (const elongation of ["", ...prismTypes]) {
      // Gyroelongated pyramids are concave
      if (n === 3 && base === "pyramid" && elongation === "antiprism") {
        continue
      }
      for (const count of [1, 2]) {
        // Cupola-rotundae only exist if there are two of them
        if (base === "cupolarotunda" && count !== 2) {
          continue
        }
        // Only cupolae, rotundae can be ortho or gyro
        if (count === 2 && base !== "pyramid" && elongation !== "antiprism") {
          for (const gyrate of ["ortho", "gyro"]) {
            items.push({
              n,
              base,
              elongation,
              count,
              gyrate,
            } as Item)
          }
        } else {
          items.push({ n, base, elongation, count } as Item)
        }
      }
    }
  }
}
items.push({ n: 2, base: "cupola", elongation: "", count: 1 })
items.push({
  n: 2,
  base: "cupola",
  elongation: "",
  count: 2,
  gyrate: "gyro",
})

const elongStr = {
  prism: "elongated",
  antiprism: "gyroelongated",
  "": "",
}

function capstoneName({ n, base, elongation, count, gyrate }: Item) {
  const baseStr = base === "cupolarotunda" ? base : countString(count, base)
  return wordJoin(
    elongStr[elongation],
    polygonPrefixes.get(n),
    prefix(gyrate, baseStr),
  )
}

export default new Table(items, capstoneName)
