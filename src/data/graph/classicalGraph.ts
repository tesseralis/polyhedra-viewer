import { Graph } from "./Graph"
import { classicals } from "../tables"

function oppositeFacet(facet: "vertex" | "face") {
  return facet === "vertex" ? "face" : "vertex"
}

export default function classicalGraph(g: Graph) {
  // operations on regular polyhedra
  for (const regular of classicals.getAll({
    operation: "regular",
  })) {
    const { family, facet } = regular
    const dual = classicals.getAll({
      family,
      facet: facet && oppositeFacet(facet),
      operation: "regular",
    })[0]
    g.addEdge("dual", regular, dual)

    const truncated = classicals.getAll({
      family,
      facet,
      operation: "truncate",
    })[0]
    g.addEdge("truncate", regular, truncated)

    // FIXME should be able to iterate instead
    const rectified = classicals.getAll({
      family,
      operation: "rectify",
    })[0]
    g.addEdge("rectify", regular, rectified)

    const cantellated = classicals.getAll({
      family,
      operation: "cantellate",
    })[0]
    g.addEdge("expand", regular, cantellated)

    const snub = classicals.getAll({
      family,
      operation: "snub",
    })[0]
    g.addEdge("snub", regular, snub)
  }

  // Expand truncated polyhedra to bevelled ones
  for (const truncated of classicals.getAll({
    operation: "truncate",
  })) {
    const { family } = truncated
    const bevelled = classicals.getAll({
      family,
      operation: "bevel",
    })[0]
    g.addEdge("expand", truncated, bevelled)
  }

  for (const rectified of classicals.getAll({
    operation: "rectify",
  })) {
    const { family } = rectified
    const bevelled = classicals.getAll({
      family,
      operation: "bevel",
    })[0]
    g.addEdge("truncate", rectified, bevelled)
    // TODO rectify and snub operations
  }

  for (const cantellated of classicals.getAll({
    operation: "cantellate",
  })) {
    const { family } = cantellated
    const snub = classicals.getAll({ family, operation: "snub" })[0]
    g.addEdge("twist", cantellated, snub)
  }
}
