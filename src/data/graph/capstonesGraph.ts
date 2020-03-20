import { Graph } from "./Graph"

import { prisms, capstones } from "../tables"

// FIXME handle cupolarotundae
export default function capstonesGraph(g: Graph) {
  for (const base of capstones.options.base) {
    for (const type of capstones.options.type) {
      if (type === "rotunda" && base !== 5) {
        continue
      }
      const prismBase = type === "pyramid" ? base : base / 2
      const prism = prisms.getAll({ base: prismBase as any, type: "prism" })[0]
      const antiprism = prisms.getAll({
        base: prismBase as any,
        type: "antiprism",
      })[0]
      const cap = capstones.getAll({ base, type, count: 1, elongation: "" })[0]
      const elongated = capstones.getAll({
        base,
        type,
        count: 1,
        elongation: "prism",
      })[0]
      const gyroelongated = capstones.getAll({
        base,
        type,
        count: 1,
        elongation: "antiprism",
      })[0]
      const gyroelongatedBi = capstones.getAll({
        base,
        type,
        count: 2,
        elongation: "antiprism",
      })[0]

      g.addEdge("augment", prism, elongated)
      g.addEdge("augment", antiprism, gyroelongated)
      g.addEdge("turn", prism, antiprism)

      g.addEdge("elongate", cap, elongated)
      g.addEdge("gyroelongate", cap, gyroelongated)
      g.addEdge("turn", elongated, gyroelongated)

      g.addEdge("augment", gyroelongated, gyroelongatedBi)

      // FIXME figure out a way to list the two options only if they have them
      for (const gyrate of capstones.options.gyrate) {
        const bi = capstones.getAll({
          base,
          type,
          gyrate,
          count: 2,
          elongation: "",
        })[0]
        const elongatedBi = capstones.getAll({
          base,
          type,
          gyrate,
          count: 2,
          elongation: "prism",
        })[0]

        g.addEdge("augment", cap, bi)
        g.addEdge("augment", elongated, elongatedBi)
        g.addEdge("elongate", bi, elongatedBi)
        g.addEdge("gyroelongate", bi, gyroelongatedBi)
        g.addEdge("turn", elongatedBi, gyroelongatedBi)
      }
    }
  }
}
