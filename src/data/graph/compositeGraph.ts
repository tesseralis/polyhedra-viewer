import type Graph from "./Graph"

import Composite from "../specs/Composite"

// FIXME type this as a Count
function dec(item: number): any {
  return item - 1
}

function inc(item: number): any {
  return item + 1
}

export default function compositeGraph(g: Graph) {
  for (const composite of Composite.getAll()) {
    const {
      gyrate = 0,
      diminished = 0,
      augmented = 0,
      align,
      source,
    } = composite.data
    if (source.canonicalName() === "rhombicosidodecahedron") {
      const count = gyrate + diminished
      if (gyrate > 0) {
        g.addEdge(
          "gyrate",
          composite,
          composite.withData({
            gyrate: dec(gyrate),
            align: count === 3 ? "meta" : undefined,
          }),
          { direction: "back" },
        )
      }
      if (diminished > 0) {
        g.addEdge(
          "augment",
          composite,
          composite.withData({
            diminished: dec(diminished),
            align: count === 3 ? "meta" : undefined,
          }),
          { type: "cupola", base: 5, gyrate: "gyro" },
        )
        g.addEdge(
          "augment",
          composite,
          composite.withData({
            diminished: dec(diminished),
            gyrate: inc(gyrate),
          }),
          { type: "cupola", base: 5, gyrate: "ortho" },
        )
      }
    } else if (source.canonicalName() === "icosahedron") {
      if (diminished > 0 && augmented === 0) {
        g.addEdge(
          "augment",
          composite,
          composite.withData({
            diminished: dec(diminished),
            align: diminished === 3 ? "meta" : undefined,
          }),
          { align, type: "pyramid", base: 5 },
        )
      }
      if (diminished === 3 && augmented === 0) {
        g.addEdge("augment", composite, composite.withData({ augmented: 1 }), {
          type: "pyramid",
          base: 3,
        })
      }
    } else {
      if (augmented > 0) {
        const typeOption =
          source.isClassical() && source.data.operation === "truncate"
            ? "cupola"
            : "pyramid"
        const baseOption = source.isClassical() ? source.data.family : 4
        const hasAlign =
          (source.isClassical() && source.data.family === 5) ||
          (source.isPrismatic() && source.data.base === 6)
        g.addEdge(
          "augment",
          composite.withData({
            augmented: dec(augmented),
            align: hasAlign && augmented === 3 ? "meta" : undefined,
          }),
          composite,
          { align, type: typeOption, base: baseOption },
        )
      }
    }
  }
}
