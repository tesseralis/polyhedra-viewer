import { minBy, range } from "lodash-es"
import { getCyclic } from "lib/utils"
import { Face, Vertex } from "math/polyhedra"
import { PolyhedronForme } from "math/formes"

type GetFaces<Forme> = (forme: Forme) => Face[]

/**
 * Return the expanded vertices of the polyhedron resized to the given distance-from-center
 * and rotated by the given angle
 */
export function getResizeFunction<Forme extends PolyhedronForme>(
  getEndFacesToMap: GetFaces<Forme>,
  getStartFacesToMap: GetFaces<Forme> = (forme) => forme.geom.faces,
) {
  return function getResizedVertices(start: Forme, end: Forme) {
    const facePairs = getFacePairs(
      getStartFacesToMap(start),
      getEndFacesToMap(end),
    )

    // create a map from the initial vertices to the end vertices
    const mapping: Vertex[] = []
    for (const [f1, f2] of facePairs) {
      for (const [v1, v2] of getVertexPairs(f1, f2)) {
        mapping[v1.index] = v2
      }
    }
    const res = start.geom.vertices.map((v) => {
      return mapping[v.index]
    })
    return res
  }
}

// Find the faces in the first set that map onto the second set
function getFacePairs(first: Face[], second: Face[]) {
  return second.map((face) => {
    return [findFacePartner(face, first), face]
  })
}

function findFacePartner(face: Face, candidates: Face[]) {
  return minBy(candidates, (face2) => {
    return face.normal().angleTo(face2.normal())
  })!
}

function getVertexPairs(f1: Face, f2: Face) {
  const partnerIndex = getPartnerVertexIndex(f1, f2)
  return f1.vertices.map((v, i) => {
    return [v, getCyclic(f2.vertices, i + partnerIndex)] as [Vertex, Vertex]
  })
}

function getPartnerVertexIndex(f1: Face, f2: Face) {
  const v0 = f1.vertices[0]
  // snub vertices aren't aligned, so get the closest one
  return minBy(range(0, f2.numSides), (i) => {
    const v = f2.vertices[i]
    return f1
      .centroid()
      .clone()
      .sub(v0.vec)
      .angleTo(f2.centroid().clone().sub(v.vec))
  })!
}
