import Table from "./Table"
import { wordJoin, prefix } from "./tableHelpers"

type Family = 3 | 4 | 5
const families: Family[] = [3, 4, 5]

type Facet = "face" | "vertex"
const facets: Facet[] = ["face", "vertex"]

type Operation =
  | "regular"
  | "truncated"
  | "rectified"
  | "bevelled"
  | "cantellated"
  | "snub"
const operations: Operation[] = [
  "regular",
  "truncated",
  "rectified",
  "bevelled",
  "cantellated",
  "snub",
]

interface Item {
  family: Family
  facet?: Facet
  operation: Operation
}

function* getItems() {
  for (const operation of operations) {
    for (const family of families) {
      if (family !== 3 && ["regular", "truncated"].includes(operation)) {
        for (const facet of facets) {
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
  if (["regular", "truncated"].includes(operation)) {
    return regularNames[family](facet)
  } else {
    return rectifiedNames[family]
  }
}

function getExpandedString(base: string, operation: Operation) {
  const str = prefix(operation === "cantellated" ? "rhombi" : "", base)
  return str.replace("ii", "i")
}

function name({ family, operation, facet }: Item) {
  const base = getBase({ family, operation, facet })
  return wordJoin(
    operation === "snub" ? operation : "",
    ["truncated", "bevelled"].includes(operation) ? "truncated" : "",
    getExpandedString(base, operation),
  )
}
export default new Table(getItems(), name)
