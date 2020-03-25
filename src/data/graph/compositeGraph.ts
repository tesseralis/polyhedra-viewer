import { mapValues } from "lodash-es"
import { Graph } from "./Graph"

import Composite from "../specs/Composite"

export default function compositeGraph(g: Graph) {
  for (const source of Composite.options.source) {
    if (source.canonicalName() === "rhombicosidodecahedron") {
      // gyrate and diminished rhombicosidodecahedra
    } else if (source.canonicalName() === "icosahedron") {
      // diminished icosahedra
      const mono = Composite.query.where({ source, diminished: 1 })[0]
      const bis = Composite.query.where({ source, diminished: 2 })
      const tri = Composite.query.where({
        source,
        diminished: 3,
        augmented: 0,
      })[0]
      const augmentedTri = Composite.query.where({
        source,
        diminished: 3,
        augmented: 1,
      })[0]

      g.addEdge("augment", mono, source)
      for (const bi of bis) {
        g.addEdge("augment", bi, mono)
      }
      const metaBi = bis.find((bi) => bi.data.align === "meta")!
      g.addEdge("augment", tri, metaBi)
      g.addEdge("augment", tri, augmentedTri)
    } else {
      // Augmented solids
      const mono = Composite.query.where({ source, augmented: 1 })[0]
      const bis = Composite.query.where({ source, augmented: 2 })
      const tri = Composite.query.where({ source, augmented: 3 })[0]

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
