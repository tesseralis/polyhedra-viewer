import { Classical, oppositeFacet, Facet } from "specs"
import { makeOpPair } from "../operationPairs"
import { Pose, getTransformedVertices } from "../operationUtils"
import ClassicalForme from "math/formes/ClassicalForme"

function getPose(forme: ClassicalForme, facet: Facet, scale: number): Pose {
  const { geom } = forme
  return {
    // Always centered on centroid
    origin: geom.centroid(),
    // Use the normal of the given face as the first axis
    scale,
    orientation: forme
      .adjacentFacetFaces(facet)
      .map((face) => face.normal()) as any,
  }
}

function getCantellatedMidradius(forme: ClassicalForme) {
  return forme.edgeFace().distanceToCenter()
}

/**
 * Take the cantellated intermediate solid and convert it to either dual
 */
function doDualTransform(forme: ClassicalForme, result: Classical) {
  const resultForme = ClassicalForme.fromSpecs(result)
  const resultSideLength =
    getCantellatedMidradius(forme) / resultForme.midradius()
  const scale = resultSideLength * resultForme.circumradius()
  const faces = forme.facetFaces(oppositeFacet(result.facet()))
  return getTransformedVertices(faces, (f) => {
    return forme.geom.centroid().clone().addScaledVector(f.normal(), scale)
  })
}

export default makeOpPair<ClassicalForme>({
  graph: function* () {
    for (const specs of Classical.query.where(
      (s) => s.isRegular() && !s.isVertex(),
    )) {
      yield { left: specs, right: specs.withData({ facet: "vertex" }) }
    }
  },
  middle: (entry) => entry.left.withOperation("cantellate"),
  getPose(forme) {
    const { geom } = forme
    if (forme.specs.isCantellated()) {
      return getPose(forme, "face", getCantellatedMidradius(forme))
    }
    if (forme.specs.isFace()) {
      return getPose(forme, "face", forme.midradius())
    }
    // for the vertex figure, pick a vertex and align it with that edge
    const vertex = geom.getVertex()
    const v2 = vertex.adjacentVertices()[0]
    return {
      origin: geom.centroid(),
      scale: forme.midradius(),
      orientation: [vertex.normal(), v2.normal()],
    }
  },
  toLeft: (forme, _, result) => doDualTransform(forme, result),
  toRight: (forme, _, result) => doDualTransform(forme, result),
})
