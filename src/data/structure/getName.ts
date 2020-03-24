import { compact } from "lodash-es"
import type Structure from "./Structure"
import { Count } from "./common"
import { PrimaryPolygon, polygonPrefixes } from "../polygons"

const countPrefixes: Record<1 | 2 | 3, string> = {
  1: "",
  2: "bi",
  3: "tri",
}

export function countString(count: Count, base: string) {
  if (count === 0) return ""
  return countPrefixes[count] + base
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

export default function getName(structure: Structure): string {
  return structure.visit({
    exceptional({ operation, family, facet }) {
      const base = ["regular", "truncate"].includes(operation)
        ? regularNames[family](facet)
        : rectifiedNames[family]
      return wordJoin(
        operation === "snub" ? operation : "",
        ["truncate", "bevel"].includes(operation) ? "truncated" : "",
        getExpandedString(base, operation),
      )
    },
    prismatic({ base, type }) {
      return `${polygonPrefixes.get(base)} ${type}`
    },
    capstone({ base, type, elongation, count, gyrate }) {
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
    },
    composite({ augmented, gyrate, diminished, align, base }) {
      return prefix(
        align,
        wordJoin(
          countString(augmented ?? 0, "augmented"),
          countString(gyrate ?? 0, "gyrate"),
          countString(diminished ?? 0, "diminished"),
          base.name(),
        ),
      )
    },
    modifiedAntiprism({ operation, base }) {
      return wordJoin(operation ?? "", base.name())
    },
    elementary({ base }) {
      return base
    },
  })
}
