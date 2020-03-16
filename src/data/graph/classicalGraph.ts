import { Graph } from "./Graph"
import { classicals } from "../tables"

function oppositeFacet(facet: "vertex" | "face") {
  return facet === "vertex" ? "face" : "vertex"
}

export default function classicalGraph(g: Graph) {
  // operations on regular polyhedra
  for (const { name, family, facet } of classicals.get({
    operation: "regular",
  })) {
    const dual = classicals.getNames({
      family,
      facet: facet && oppositeFacet(facet),
      operation: "regular",
    })[0]
    g.addEdge({ operation: "dual", from: name, to: dual })

    // FIXME be able to get just a single item with the name
    const truncated = classicals.getNames({
      family,
      facet,
      operation: "truncated",
    })[0]
    g.addEdge({ operation: "truncate", from: name, to: truncated })

    // FIXME should be able to iterate instead
    const rectified = classicals.getNames({
      family,
      operation: "rectified",
    })[0]
    g.addEdge({
      operation: "rectify",
      from: name,
      to: rectified,
      options: { facet },
    })

    const cantellated = classicals.getNames({
      family,
      operation: "cantellated",
    })[0]
    g.addEdge({
      operation: "expand",
      from: name,
      to: cantellated,
      options: { facet },
    })

    const snub = classicals.getNames({
      family,
      operation: "snub",
    })[0]
    g.addEdge({
      operation: "snub",
      from: name,
      to: snub,
      options: { facet, chiral: true },
    })
  }

  // Expand truncated polyhedra to bevelled ones
  for (const { name, family, facet } of classicals.get({
    operation: "truncated",
  })) {
    const bevelled = classicals.getNames({
      family,
      operation: "bevelled",
    })[0]
    g.addEdge({
      operation: "expand",
      from: name,
      to: bevelled,
      options: { facet },
    })
  }

  for (const { name, family } of classicals.get({
    operation: "rectified",
  })) {
    const bevelled = classicals.getNames({
      family,
      operation: "bevelled",
    })[0]
    g.addEdge({ operation: "truncate", from: name, to: bevelled })
    // TODO rectify and snub operations
  }

  for (const { name, family } of classicals.get({ operation: "cantellated" })) {
    const snub = classicals.getNames({ family, operation: "snub" })[0]
    g.addEdge({
      operation: "twist",
      from: name,
      to: snub,
      options: { chiral: true },
    })
  }
}
