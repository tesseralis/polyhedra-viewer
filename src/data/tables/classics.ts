import Table from "./Table"

interface Item {
  n: 3 | 4 | 5
  type?: "face" | "vertex"
  // FIXME I wonder if there is a more elegant way to split this up
  operation:
    | "regular"
    | "truncated"
    | "rectified"
    | "bevelled"
    | "cantellated"
    | "snub"
}

function* getItems() {
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
          yield { n, operation, type } as Item
        }
      } else {
        yield { n, operation } as Item
      }
    }
  }
}

function name({ n, operation, type }: Item) {
  const base = (() => {
    switch (n) {
      case 3:
        // FIXME this is kind of inelegant since we duplicate this logic above
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
}
export default new Table([...getItems()], name)
