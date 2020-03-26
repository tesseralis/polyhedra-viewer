import { mapValues } from "lodash-es"
import { Graph } from "./Graph"
import Classical from "../specs/Classical"

function getPair<T>(array: T[]) {
  if (array.length > 2) {
    throw new Error("Invalid array")
  }
  if (array.length === 2) {
    return array
  }
  return [array[0], array[0]]
}

const mapping: Record<string, Classical["data"]["operation"]> = {
  rectified: "rectify",
  bevelled: "bevel",
  cantellated: "cantellate",
  snub: "snub",
}

export default function classicalGraph(g: Graph) {
  // operations on regular polyhedra
  for (const family of Classical.options.family) {
    const regulars = Classical.query.where({ family, operation: "regular" })

    const { rectified, bevelled, cantellated, snub } = mapValues(
      mapping,
      (operation) => Classical.query.withData({ family, operation }),
    )

    const [faceReg, vertexReg] = getPair(regulars)
    g.addEdge("dual", faceReg, vertexReg)

    for (const regular of regulars) {
      const truncated = Classical.query.withData({
        family,
        facet: regular.data.facet,
        operation: "truncate",
      })

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
