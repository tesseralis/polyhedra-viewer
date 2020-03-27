import { Graph } from "./Graph"

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
    const { gyrate = 0, diminished = 0, augmented = 0, source } = composite.data
    if (source.canonicalName() === "rhombicosidodecahedron") {
      const count = gyrate + diminished
      if (gyrate > 0) {
        g.addEdge(
          "gyrate",
          composite,
          composite.withData({ gyrate: dec(gyrate) }),
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
        )
        g.addEdge(
          "augment",
          composite,
          composite.withData({
            gyrate: dec(diminished),
            diminished: inc(gyrate),
          }),
        )
      }
    } else if (source.canonicalName() === "icosahedron") {
      if (diminished > 0) {
        g.addEdge(
          "augment",
          composite,
          composite.withData({
            diminished: dec(diminished),
            align: diminished === 3 ? "meta" : undefined,
          }),
        )
      }
      if (diminished === 3 && augmented === 0) {
        g.addEdge("augment", composite, composite.withData({ augmented: 1 }))
      }
    } else {
      if (augmented > 0) {
        g.addEdge(
          "augment",
          composite.withData({
            augmented: dec(augmented),
            align: augmented === 3 ? "meta" : undefined,
          }),
          composite,
        )
      }
    }
  }
}
