import { polygonPrefixes } from "../polygons"
import Table from "./Table"
import {
  prefix,
  wordJoin,
  countString,
  PrismType,
  prismTypes,
  Count,
} from "./tableHelpers"

type FaceType = 2 | 3 | 4 | 5
const faceTypes: FaceType[] = [3, 4, 5]

type Base = "pyramid" | "cupola" | "rotunda" | "cupolarotunda"
const bases: Base[] = ["pyramid", "cupola", "rotunda", "cupolarotunda"]

type CapCount = Exclude<Count, 3>
const counts: CapCount[] = [1, 2]

type ElongType = "" | PrismType
const elongations: ElongType[] = ["", ...prismTypes]

type GyrateOpt = "ortho" | "gyro"
const gyrateOpts: GyrateOpt[] = ["ortho", "gyro"]

interface Item {
  n: FaceType
  base: Base
  elongation: ElongType
  count: CapCount
  gyrate?: GyrateOpt
}
const items: Item[] = []
for (const n of faceTypes) {
  for (const base of bases) {
    // Only pentagonal rotundae exist
    if (["rotunda", "cupolarotunda"].includes(base) && n !== 5) {
      continue
    }
    for (const elongation of elongations) {
      // Gyroelongated pyramids are concave
      if (n === 3 && base === "pyramid" && elongation === "antiprism") {
        continue
      }
      for (const count of counts) {
        // Cupola-rotundae only exist if there are two of them
        if (base === "cupolarotunda" && count !== 2) {
          continue
        }
        // Only cupolae, rotundae can be ortho or gyro
        if (count === 2 && base !== "pyramid" && elongation !== "antiprism") {
          for (const gyrate of gyrateOpts) {
            items.push({
              n,
              base,
              elongation,
              count,
              gyrate,
            })
          }
        } else {
          items.push({ n, base, elongation, count })
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
