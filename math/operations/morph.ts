import { minBy, range } from "lodash-es"
import { getCyclic } from "lib/utils"
import { Face, Vertex } from "math/polyhedra"
import { PolyhedronForme } from "math/formes"

type GetFaces<Forme> = (forme: Forme) => Face[]

/**
 * Create a morph function that maps faces from the start polyhedron
 * to the end polyhedron. It is assumed that the start polyhedron
 * has more faces and collapses into the end polyhedron.
 */
export function getMorphFunction<Forme extends PolyhedronForme>(
  endFacesToMorph: GetFaces<Forme> = (forme) => forme.geom.faces,
  startFacesToMorph: GetFaces<Forme> = (forme) => forme.geom.faces,
) {
  return function getMorphedVertices(start: Forme, end: Forme) {
    const facePairs = getFacePairs(
      startFacesToMorph(start),
      endFacesToMorph(end),
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
