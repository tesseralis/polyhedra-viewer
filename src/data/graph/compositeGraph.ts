import { Graph } from "./Graph"

import Composite from "../specs/Composite"

export default function compositeGraph(g: Graph) {
  for (const source of Composite.options.source) {
    if (source.canonicalName() === "rhombicosidodecahedron") {
      // gyrate and diminished rhombicosidodecahedra
      // FIXME decide if we're using raw source or not
      const composites = Composite.query.where({ source })
      for (const composite of composites) {
        const { gyrate = 0, diminished = 0 } = composite.data
        const count = gyrate + diminished
        if (gyrate > 0) {
          g.addEdge(
            "gyrate",
            composite,
            Composite.query.withData({
              source,
              gyrate: (gyrate - 1) as any,
              diminished,
            }),
          )
        }
        if (diminished > 0) {
          g.addEdge(
            "augment",
            composite,
            Composite.query.withData({
              source,
              gyrate,
              diminished: (diminished - 1) as any,
              align: count === 3 ? "meta" : undefined,
            }),
          )
          g.addEdge(
            "augment",
            composite,
            Composite.query.withData({
              source,
              gyrate: (gyrate - 1) as any,
              diminished: (diminished + 1) as any,
            }),
          )
        }
      }
    } else if (source.canonicalName() === "icosahedron") {
      // diminished icosahedra
      const mono = Composite.query.withData({ source, diminished: 1 })
      const bis = Composite.query.where({ source, diminished: 2 })
      const tri = Composite.query.withData({
        source,
        diminished: 3,
        augmented: 0,
      })
      const augmentedTri = Composite.query.withData({
        source,
        diminished: 3,
        augmented: 1,
      })

      g.addEdge("augment", mono, source)
      for (const bi of bis) {
        g.addEdge("augment", bi, mono)
      }
      const metaBi = bis.find((bi) => bi.data.align === "meta")!
      g.addEdge("augment", tri, metaBi)
      g.addEdge("augment", tri, augmentedTri)
    } else {
      // Augmented solids
      const mono = Composite.query.withData({ source, augmented: 1 })
      const bis = Composite.query.where({ source, augmented: 2 })
      const tri = Composite.query.withData({ source, augmented: 3 })

      g.addEdge("augment", source, mono)
      for (const bi of bis) {
        g.addEdge("augment", mono, bi)
      }
      const metaBi = bis.find((bi) => bi.data.align === "meta")
      if (!!tri && !!metaBi) {
        g.addEdge("augment", metaBi, tri)
      }
    }
  }
}
