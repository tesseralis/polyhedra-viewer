import { compact } from "lodash-es"
import type Structure from "./Structure"
import { Count } from "./common"
import { polygonPrefixes } from "../polygons"

const countPrefixes: Record<Exclude<Count, 0>, string> = {
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

// FIXME inherit from the ./common
const rectifiedNames: Record<3 | 4 | 5, string> = {
  3: "tetratetrahedron",
  4: "cuboctahedron",
  5: "icosidodecahedron",
}

const regularNames: Record<3 | 4 | 5, (facet?: "face" | "vertex") => string> = {
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
          countString(augmented, "augmented"),
          countString(gyrate, "gyrate"),
          countString(diminished, "diminished"),
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
