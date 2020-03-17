import { Graph } from "./Graph"
import { classicals } from "../tables"

function oppositeFacet(facet: "vertex" | "face") {
  return facet === "vertex" ? "face" : "vertex"
}

export default function classicalGraph(g: Graph) {
  // operations on regular polyhedra
  for (const { name, family, facet } of classicals.getAll({
    operation: "regular",
  })) {
    const dual = classicals.getName({
      family,
      facet: facet && oppositeFacet(facet),
      operation: "regular",
    })
    g.addEdge({ operation: "dual", from: name, to: dual })

    // FIXME be able to get just a single item with the name
    const truncated = classicals.getName({
      family,
      facet,
      operation: "truncate",
    })
    g.addEdge({ operation: "truncate", from: name, to: truncated })

    // FIXME should be able to iterate instead
    const rectified = classicals.getName({
      family,
      operation: "rectify",
    })
    g.addEdge({
      operation: "rectify",
      from: name,
      to: rectified,
      options: { facet },
    })

    const cantellated = classicals.getName({
      family,
      operation: "cantellate",
    })
    g.addEdge({
      operation: "expand",
      from: name,
      to: cantellated,
      options: { facet },
    })

    const snub = classicals.getName({
      family,
      operation: "snub",
    })
    g.addEdge({
      operation: "snub",
      from: name,
      to: snub,
      options: { facet, chiral: true },
    })
  }

  // Expand truncated polyhedra to bevelled ones
  for (const { name, family, facet } of classicals.getAll({
    operation: "truncate",
  })) {
    const bevelled = classicals.getName({
      family,
      operation: "bevel",
    })
    g.addEdge({
      operation: "expand",
      from: name,
      to: bevelled,
      options: { facet },
    })
  }

  for (const { name, family } of classicals.getAll({
    operation: "rectify",
  })) {
    const bevelled = classicals.getName({
      family,
      operation: "bevel",
    })
    g.addEdge({ operation: "truncate", from: name, to: bevelled })
    // TODO rectify and snub operations
  }

  for (const { name, family } of classicals.getAll({
    operation: "cantellate",
  })) {
    const snub = classicals.getName({ family, operation: "snub" })
    g.addEdge({
      operation: "twist",
      from: name,
      to: snub,
      options: { chiral: true },
    })
  }
}
