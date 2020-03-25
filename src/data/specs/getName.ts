import { compact } from "lodash-es"
import type Specs from "./PolyhedronSpecs"
import { PrimaryPolygon, polygonPrefixes } from "../polygons"

const countPrefixes: Record<number, string> = { 1: "", 2: "bi", 3: "tri" }

export function countString(count: number, base: string) {
  if (count === 0) return ""
  return `${countPrefixes[count]}${base}`
}

export function wordJoin(...array: (string | undefined)[]) {
  return compact(array).join(" ")
}

export function prefix(prefix: string = "", rest: string) {
  return `${prefix}${rest}`
}

const rectifiedNames: Record<PrimaryPolygon, string> = {
  3: "tetratetrahedron",
  4: "cuboctahedron",
  5: "icosidodecahedron",
}

const regularNames: Record<
  PrimaryPolygon,
  (facet?: "face" | "vertex") => string
> = {
  3: () => "tetrahedron",
  4: (facet) => (facet === "face" ? "cube" : "octahedron"),
  5: (facet) => (facet === "face" ? "dodecahedron" : "icosahedron"),
}

function getExpandedString(base: string, operation: string) {
  const str = prefix(operation === "cantellate" ? "rhombi" : "", base)
  return str.replace("ii", "i")
}

export default function getName(solid: Specs): string {
  if (solid.isClassical()) {
    const { operation, family, facet } = solid.data
    const base = ["regular", "truncate"].includes(operation)
      ? regularNames[family](facet)
      : rectifiedNames[family]
    return wordJoin(
      operation === "snub" ? operation : "",
      ["truncate", "bevel"].includes(operation) ? "truncated" : "",
      getExpandedString(base, operation),
    )
  }

  if (solid.isPrismatic()) {
    const { base, type } = solid.data
    return `${polygonPrefixes.get(base)} ${type}`
  }

  if (solid.isCapstone()) {
    const { base, type, elongation, count, gyrate } = solid.data
    const elongStr = {
      prism: "elongated",
      antiprism: "gyroelongated",
      "": "",
    }
    const baseStr = type === "cupolarotunda" ? type : countString(count, type)
    return wordJoin(
      elongStr[elongation ?? ""],
      polygonPrefixes.get(base),
      prefix(gyrate, baseStr),
    )
  }

  if (solid.isComposite()) {
    const {
      augmented = 0,
      gyrate = 0,
      diminished = 0,
      align,
      source,
    } = solid.data
    return prefix(
      align,
      wordJoin(
        countString(augmented, "augmented"),
        countString(gyrate, "gyrate"),
        countString(diminished, "diminished"),
        source.name(),
      ),
    )
  }

  if (solid.isModifiedAntiprism()) {
    const { operation, source } = solid.data
    return wordJoin(operation ?? "", source.name())
  }

  if (solid.isElementary()) {
    return solid.data.base
  }

  throw new Error(`Invalid solid of type ${solid.type}`)
}
