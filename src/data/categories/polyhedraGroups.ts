import Category from "./Category"
import { polygonPrefixes } from "math/polygons"
import { getCanonicalName } from "math/polyhedra/names"

export const prisms = (() => {
  interface PrismItem {
    n: 3 | 4 | 5 | 6 | 8 | 10
    type: "prism" | "antiprism"
  }

  const prismItems: PrismItem[] = []
  for (const n of [3, 4, 5, 6, 8, 10]) {
    for (const type of ["prism", "antiprism"]) {
      // TODO how to get around this?
      prismItems.push({ n, type } as PrismItem)
    }
  }
  function prismName({ n, type }: PrismItem) {
    return getCanonicalName(`${polygonPrefixes.get(n)} ${type}`)
  }
  return new Category<PrismItem>(prismItems, prismName)
})()

export const capstones = (() => {
  interface CapstoneItem {
    n: 2 | 3 | 4 | 5
    base: "pyramid" | "cupola" | "rotunda" | "cupola-rotunda"
    elongation: "" | "prism" | "antiprism"
    gyrate?: "ortho" | "gyro"
    count: 1 | 2
  }
  const capstoneItems: CapstoneItem[] = []
  for (const n of [2, 3, 4, 5]) {
    for (const base of ["pyramid", "cupola", "rotunda", "cupola-rotunda"]) {
      // Only pentagonal rotundae exist
      if (base === "rotunda" && n !== 5) {
        continue
      }
      for (const elongation of ["", "prism", "antiprism"]) {
        // Gyroelongated pyramids are concave
        if (n === 3 && base === "pyramid" && elongation === "antiprism") {
          continue
        }
        for (const count of [1, 2]) {
          // Cupola-rotundae only exist if there are two of them
          if (base === "cupola-rotunda" && count !== 2) {
            continue
          }
          // Only cupolae, rotundae can be ortho or gyro
          if (count === 2 && base !== "pyramid") {
            for (const gyrate of ["ortho", "gyro"]) {
              // Only the gyrobifastigium exists for these constraints
              if (
                n === 2 &&
                (base !== "cupola" ||
                  elongation !== "" ||
                  count !== 2 ||
                  gyrate !== "gyro")
              ) {
                continue
              }
              capstoneItems.push({
                n,
                base,
                elongation,
                count,
                gyrate,
              } as CapstoneItem)
            }
          } else {
            capstoneItems.push({ n, base, elongation, count } as CapstoneItem)
          }
        }
      }
    }
  }
  function capstoneName({ n, base, elongation, count, gyrate }: CapstoneItem) {
    const prefix = polygonPrefixes.get(n)
    const elongStr = (() => {
      switch (elongation) {
        case "prism":
          return "elongated"
        case "antiprism":
          return "gyroelongated"
        default:
          return ""
      }
    })()
    const countStr = (() => {
      if (base === "cupola-rotunda") return ""
      return count > 1 ? "bi" : ""
    })()
    return `${prefix} ${elongStr} ${gyrate ?? ""}${countStr}${base}`
  }

  return new Category(capstoneItems, capstoneName)
})()
