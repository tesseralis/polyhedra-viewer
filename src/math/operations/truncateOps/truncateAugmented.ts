import { Composite } from "specs"
import { makeOpPair } from "../operationPairs"
import { getCentroid } from "math/geom"
import { getTransformedVertices } from "../operationUtils"
import { AugmentedClassicalForme } from "math/formes/CompositeForme"
import { find } from "utils"
import { getSharpenPoint, getSharpenPointEdge } from "./truncateHelpers"

export default makeOpPair<AugmentedClassicalForme>({
  graph: function* () {
    for (const entry of Composite.query.where(
      (s) =>
        s.isAugmentedClassical() &&
        s.data.source.isClassical() &&
        s.data.source.isRegular(),
    )) {
      yield {
        left: entry,
        right: entry.withData({
          source: entry.sourceClassical().withOperation("truncate"),
        }),
      }
    }
  },
  middle: "right",
  getPose($, forme) {
    const { specs } = forme
    const caps = forme.caps()
    // Calculate the centroid *only* for the source polyhedra
    const centroid = forme.sourceCentroid()
    const cap = caps[0]
    const boundary = cap.boundary()

    let crossAxis
    if (specs.isTri()) {
      // Use the midpoin of the normals of the two other caps
      crossAxis = getCentroid([caps[1].normal(), caps[2].normal()])
    } else if (specs.isBi() && specs.isMeta()) {
      // If metabiaugmented, use the normal of the other cap
      crossAxis = caps[1].normal()
    } else {
      crossAxis = find(boundary.edges, (e) => forme.isMainFace(e.twinFace()))
        .midpoint()
        .clone()
        .sub(boundary.centroid())
    }

    return {
      origin: centroid,
      scale: forme.mainFace().centroid().distanceTo(centroid),
      orientation: [cap.normal(), crossAxis],
    }
  },
  toLeft(forme) {
    const truncatedFaces = forme.minorFaces()
    // the inner faces of the caps
    const cupolaFaces = forme.capTops()
    return getTransformedVertices(
      [...truncatedFaces, ...cupolaFaces],
      (face) => {
        if (cupolaFaces.some((f) => f.equals(face))) {
          // Sharpen the cupola faces
          const v = face.vertices[0]
          // Find a triangular cupola face
          const otherFace = find(
            v.adjacentFaces(),
            (f) => f.numSides === 3 && !f.equals(face),
          )!

          return getSharpenPoint(face, v.vec, otherFace.centroid())
        } else {
          const edge = find(face.edges, (e) => forme.isMainFace(e.twinFace()))
          return getSharpenPointEdge(face, edge)
        }
      },
    )
  },
})
