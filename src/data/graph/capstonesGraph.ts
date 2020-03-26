import { mapValues } from "lodash-es"
import { Graph } from "./Graph"

import Prismatic from "../specs/Prismatic"
import Capstone from "../specs/Capstone"

const prismMapping: Record<string, Prismatic["data"]["type"]> = {
  prism: "prism",
  antiprism: "antiprism",
}

const nonGyrateMapping: Record<string, Partial<Capstone["data"]>> = {
  cap: { count: 1, elongation: null },
  elongated: { count: 1, elongation: "prism" },
  gyroelongated: { count: 1, elongation: "antiprism" },
  gyroeongatedBi: { count: 2, elongation: "antiprism" },
}

const gyrateMapping: Record<string, Partial<Capstone["data"]>> = {
  bi: { count: 2, elongation: null },
  elongatedBi: { count: 2, elongation: "prism" },
}

// FIXME handle cupolarotundae
export default function capstonesGraph(g: Graph) {
  for (const base of Capstone.options.base) {
    for (const type of Capstone.options.type) {
      if (type === "rotunda" && base !== 5) {
        continue
      }
      const prismBase = type === "pyramid" ? base : base * 2
      const { prism, antiprism } = mapValues(prismMapping, (type) =>
        Prismatic.query.withData({ type, base: prismBase as any }),
      )

      const {
        cap,
        elongated,
        gyroelongated,
        gyroelongatedBi,
      } = mapValues(nonGyrateMapping, (filter) =>
        Capstone.query.withData({ base, type, ...(filter as any) }),
      )

      // Operations on prisms
      g.addEdge("augment", prism, elongated)
      g.addEdge("augment", antiprism, gyroelongated)
      g.addEdge("turn", prism, antiprism)

      // Prism opts
      g.addEdge("elongate", cap, elongated)
      g.addEdge("gyroelongate", cap, gyroelongated)
      g.addEdge("turn", elongated, gyroelongated)

      g.addEdge("augment", gyroelongated, gyroelongatedBi)

      // FIXME figure out a way to list the two options only if they have them
      // TODO gyrate ortho to gyro
      for (const gyrate of Capstone.options.gyrate) {
        const { bi, elongatedBi } = mapValues(gyrateMapping, (filter) =>
          Capstone.query.withData({ base, type, gyrate, ...(filter as any) }),
        )
        g.addEdge("augment", cap, bi)
        g.addEdge("augment", elongated, elongatedBi)
        g.addEdge("elongate", bi, elongatedBi)
        g.addEdge("gyroelongate", bi, gyroelongatedBi)
        g.addEdge("turn", elongatedBi, gyroelongatedBi)
        g.addEdge("gyrate", gyroelongatedBi, gyroelongatedBi)
      }
    }
  }
}
