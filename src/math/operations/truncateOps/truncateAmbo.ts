import { sum } from "lodash-es"
import { facets } from "data/specs/Classical"
import { getTransformedVertices, Pose } from "../operationUtils"
import ClassicalForme from "math/formes/ClassicalForme"
import { makeTruncateTrio } from "./truncateHelpers"

function avgInradius(forme: ClassicalForme) {
  return sum(facets.map((f) => forme.inradius(f))) / facets.length
}

function getAmboPose(forme: ClassicalForme): Pose {
  return {
    origin: forme.geom.centroid(),
    scale: avgInradius(forme),
    orientation: forme
      .adjacentFacetFaces("face")
      .map((face) => face.normal()) as any,
  }
}

/**
 * A trio of operations that describe the truncation behavior on a quasi-regular polyhedron
 * (tetratetrahedron, cuboctahedron, and icosidodecahedron).
 *
 * A raw truncation on one of these doesn't yield a CRF solid. We need to do some fudging
 * in order to everything to align correctly.
 *
 * We calculate the average inradius between the face-facet faces and the vertex-facet faces
 * and use that as a scale. For both, we use a reference polyhedron and calculate the vertex
 * transformations based on them.
 */
export default makeTruncateTrio(getAmboPose, {
  left: {
    operation: "rectify",
    transformer(forme, $, result) {
      const refForme = ClassicalForme.fromSpecs(result)
      const refInradius = avgInradius(refForme)
      const inradius = avgInradius(forme)
      const scale = (refForme.circumradius() / refInradius) * inradius
      // Sharpen each of the faces to a point aligning with the vertices
      // of the rectified solid
      return getTransformedVertices(forme.edgeFaces(), (f) =>
        forme.geom.centroid().add(f.normal().scale(scale)),
      )
    },
  },
  middle: { operation: "bevel" },
  right: {
    operation: "cantellate",
    transformer(forme, $, result) {
      const refForme = ClassicalForme.fromSpecs(result)
      const edgeFace = refForme.edgeFace()
      const refMidradius = edgeFace.distanceToCenter()
      const scale = avgInradius(forme) / avgInradius(refForme)
      return getTransformedVertices(forme.edgeFaces(), (f) => {
        const faceCentroid = forme.geom
          .centroid()
          .add(f.normal().scale(refMidradius * scale))

        return (v) =>
          faceCentroid.add(
            v
              .sub(f.centroid())
              .getNormalized()
              .scale(edgeFace.radius() * scale),
          )
      })
    },
  },
})
