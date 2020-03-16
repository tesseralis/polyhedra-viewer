import Table from "./Table"
import { FieldOptions, wordJoin, prefix } from "./tableHelpers"

type Family = 3 | 4 | 5
type Facet = "face" | "vertex"
type Operation =
  | "regular"
  | "truncate"
  | "rectify"
  | "bevel"
  | "cantellate"
  | "snub"

interface Item {
  family: Family
  facet?: Facet
  operation: Operation
}

const options: FieldOptions<Item> = {
  family: [3, 4, 5],
  facet: ["face", "vertex"],
  operation: ["regular", "truncate", "rectify", "bevel", "cantellate", "snub"],
}

function* getItems() {
  for (const operation of options.operation) {
    for (const family of options.family) {
      if (family !== 3 && ["regular", "truncate"].includes(operation)) {
        for (const facet of options.facet) {
          yield { family, operation, facet }
        }
      } else {
        yield { family, operation }
      }
    }
  }
}

const rectifiedNames: Record<Family, string> = {
  3: "tetratetrahedron",
  4: "cuboctahedron",
  5: "icosidodecahedron",
}

const regularNames: Record<Family, (facet?: Facet) => string> = {
  3: () => "tetrahedron",
  4: facet => (facet === "face" ? "cube" : "octahedron"),
  5: facet => (facet === "face" ? "dodecahedron" : "icosahedron"),
}

function getBase({ family, operation, facet }: Item) {
  if (["regular", "truncate"].includes(operation)) {
    return regularNames[family](facet)
  } else {
    return rectifiedNames[family]
  }
}

function getExpandedString(base: string, operation: Operation) {
  const str = prefix(operation === "cantellate" ? "rhombi" : "", base)
  return str.replace("ii", "i")
}

export default new Table<Item>({
  items: getItems(),
  options,
  getName({ family, operation, facet }) {
    const base = getBase({ family, operation, facet })
    return wordJoin(
      operation === "snub" ? operation : "",
      ["truncate", "bevel"].includes(operation) ? "truncated" : "",
      getExpandedString(base, operation),
    )
  },
})
