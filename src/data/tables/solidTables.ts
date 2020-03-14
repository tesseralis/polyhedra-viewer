import { range } from "lodash-es"
import Category from "./Table"
import { polygonPrefixes } from "../polygons"
import { getCanonicalName } from "../names"

// TODO this is definitely repeated
type AlignOpts = "meta" | "para"
const alignOpts: AlignOpts[] = ["meta", "para"]

function countStr(count: 1 | 2 | 3) {
  switch (count) {
    case 1:
      return ""
    case 2:
      return "bi"
    case 3:
      return "tri"
  }
}

/**
 * "Classical" Polyhedra refers to Platonic and Archimedean solids.
 */
export const classics = (() => {
  interface Item {
    n: 3 | 4 | 5
    type?: "face" | "vertex"
    operation:
      | "regular"
      | "truncated"
      | "rectified"
      | "bevelled"
      | "cantellated"
      | "snub"
  }

  const items: Item[] = []
  for (const operation of [
    "regular",
    "truncated",
    "rectified",
    "bevelled",
    "cantellated",
    "snub",
  ]) {
    for (const n of [3, 4, 5]) {
      if (n !== 3 && ["regular", "truncated"].includes(operation)) {
        for (const type of ["face", "vertex"]) {
          items.push({ n, operation, type } as Item)
        }
      } else {
        items.push({ n, operation } as Item)
      }
    }
  }
  function name({ n, operation, type }: Item) {
    const base = (() => {
      switch (n) {
        case 3:
          // TODO this is kind of inelegant since we duplicate this logic above
          // I think we can think of a better way to think about this...
          if (["regular", "truncated"].includes(operation)) {
            return "tetrahedron"
          } else {
            return "tetratetrahedron"
          }
        case 4: {
          switch (type) {
            case "face":
              return "cube"
            case "vertex":
              return "octahedron"
            default:
              return "cuboctahedron"
          }
        }
        case 5: {
          switch (type) {
            case "face":
              return "dodecahedron"
            case "vertex":
              return "icosahedron"
            default:
              return "icosidodecahedron"
          }
        }
      }
    })()
    const value = (() => {
      switch (operation) {
        case "regular":
        case "rectified":
          return base
        case "cantellated":
          return base.startsWith("i") ? `rhomb${base}` : `rhombi${base}`
        case "snub":
          return `snub ${base}`
        case "bevelled":
        case "truncated":
          return `truncated ${base}`
      }
    })()
    return getCanonicalName(value)
  }
  return new Category(items, name)
})()

export const prisms = (() => {
  interface Item {
    n: 3 | 4 | 5 | 6 | 8 | 10
    type: "prism" | "antiprism"
  }

  const items: Item[] = []
  for (const n of [3, 4, 5, 6, 8, 10]) {
    for (const type of ["prism", "antiprism"]) {
      // TODO how to get around this?
      items.push({ n, type } as Item)
    }
  }
  function name({ n, type }: Item) {
    return getCanonicalName(`${polygonPrefixes.get(n)} ${type}`)
  }
  return new Category(items, name)
})()

export const capstones = (() => {
  interface CapstoneItem {
    n: 2 | 3 | 4 | 5
    base: "pyramid" | "cupola" | "rotunda" | "cupolarotunda"
    elongation: "" | "prism" | "antiprism"
    gyrate?: "ortho" | "gyro"
    count: 1 | 2
  }
  const capstoneItems: CapstoneItem[] = []
  for (const n of [3, 4, 5]) {
    for (const base of ["pyramid", "cupola", "rotunda", "cupolarotunda"]) {
      // Only pentagonal rotundae exist
      if (["rotunda", "cupolarotunda"].includes(base) && n !== 5) {
        continue
      }
      for (const elongation of ["", "prism", "antiprism"]) {
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
  capstoneItems.push({ n: 2, base: "cupola", elongation: "", count: 1 })
  capstoneItems.push({
    n: 2,
    base: "cupola",
    elongation: "",
    count: 2,
    gyrate: "gyro",
  })
  function capstoneName({ n, base, elongation, count, gyrate }: CapstoneItem) {
    const prefix = polygonPrefixes.get(n)
    const elongStr = (() => {
      switch (elongation) {
        case "prism":
          return "elongated "
        case "antiprism":
          return "gyroelongated "
        default:
          return ""
      }
    })()
    const countString = base === "cupolarotunda" ? "" : countStr(count)
    return getCanonicalName(
      `${elongStr}${prefix} ${gyrate ?? ""}${countString}${base}`,
    )
  }

  return new Category(capstoneItems, capstoneName)
})()

export const augmentedPrisms = (() => {
  interface Item {
    n: 3 | 4 | 5 | 6
    count: 1 | 2 | 3
    align?: AlignOpts
  }
  const items: Item[] = []
  for (const n of [3, 4, 5, 6]) {
    for (const count of range(1, [3, 6].includes(n) ? 4 : 3)) {
      if (n === 6 && count === 2) {
        for (const align in alignOpts) {
          items.push({ n, count, align } as Item)
        }
      } else {
        items.push({ n, count } as Item)
      }
    }
  }
  function name({ n, count, align }: Item) {
    return getCanonicalName(
      `${align ?? ""}${countStr(count)}augmented ${polygonPrefixes.get(
        n,
      )} prism`,
    )
  }
  return new Category(items, name)
})()

export const augmentedPlatonic = (() => {
  interface Item {
    base: "tetrahedron" | "cube" | "dodecahedron"
    truncation: "" | "truncated"
    count: 1 | 2 | 3
    align?: AlignOpts
  }
  function countFor(base: Item["base"]) {
    switch (base) {
      case "tetrahedron":
        return 1
      case "cube":
        return 2
      case "dodecahedron":
        return 3
    }
  }
  const items: Item[] = []
  for (const base of ["tetrahedron", "cube", "dodecahedron"]) {
    for (const truncation of ["", "truncated"]) {
      for (const count of range(1, countFor(base as any) + 1)) {
        if (base === "dodecahedron" && count === 2) {
          for (const align of alignOpts) {
            items.push({ base, truncation, count, align } as Item)
          }
        } else {
          items.push({ base, truncation, count } as Item)
        }
      }
    }
  }
  function name({ base, truncation, count, align }: Item) {
    return getCanonicalName(
      `${align ?? ""}${countStr(count)}augmented ${
        truncation ? truncation + " " : ""
      }${base}`,
    )
  }
  return new Category(items, name)
})()

export const rhombicosidodecahedra = (() => {
  interface Item {
    gyrate: 0 | 1 | 2 | 3
    diminished: 0 | 1 | 2 | 3
    align?: AlignOpts
  }
  const items: Item[] = []
  for (const gyrate of range(4)) {
    for (const diminished of range(4 - gyrate)) {
      if (gyrate + diminished === 2) {
        for (const align of alignOpts) {
          items.push({ gyrate, diminished, align } as Item)
        }
      } else {
        items.push({ gyrate, diminished } as Item)
      }
    }
  }
  function name({ gyrate, diminished, align }: Item) {
    const gyrateStr = gyrate !== 0 ? `${countStr(gyrate)}gyrate ` : ""
    const diminishedStr =
      diminished !== 0 ? `${countStr(diminished)}diminished ` : ""
    return getCanonicalName(
      `${align ?? ""}${gyrateStr}${diminishedStr}rhombicosidodecahedron`,
    )
  }
  return new Category(items, name)
})()
