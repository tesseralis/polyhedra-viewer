import { Graph } from "./Graph"
import { classicals } from "../tables"

function oppositeFacet(facet: "vertex" | "face") {
  return facet === "vertex" ? "face" : "vertex"
}

export default function classicalGraph(g: Graph) {
  // operations on regular polyhedra
  for (const family of classicals.options.family) {
    const regulars = classicals.getAll({ family, operation: "regular" })

    const rectified = classicals.getAll({
      family,
      operation: "rectify",
    })[0]

    const bevelled = classicals.getAll({
      family,
      operation: "bevel",
    })[0]

    const cantellated = classicals.getAll({
      family,
      operation: "cantellate",
    })[0]

    const snub = classicals.getAll({
      family,
      operation: "snub",
    })[0]

    for (const regular of regulars) {
      const dual = classicals.getAll({
        family,
        facet: regular.facet && oppositeFacet(regular.facet),
        operation: "regular",
      })[0]

      const truncated = classicals.getAll({
        family,
        facet: regular.facet,
        operation: "truncate",
      })[0]

      g.addEdge("dual", regular, dual)
      g.addEdge("truncate", regular, truncated)
      g.addEdge("rectify", regular, rectified)
      g.addEdge("expand", regular, cantellated)
      g.addEdge("snub", regular, snub)

      g.addEdge("expand", truncated, bevelled)
    }

    g.addEdge("truncate", rectified, bevelled)
    g.addEdge("twist", cantellated, snub)
  }
}
