import { minBy, range } from "lodash-es"
import { getCyclic } from "lib/utils"
import { Face, Vertex } from "math/polyhedra"
import { PolyhedronForme } from "math/formes"

type GetFacets<Forme> = (forme: Forme) => (Face | Vertex)[]
type GetFaces<Forme> = (forme: Forme) => Face[]

/**
 * Create a morph function that maps faces from the start polyhedron
 * to the end polyhedron. It is assumed that the start polyhedron
 * has more faces and collapses into the end polyhedron.
 */
export function getMorphFunction<Forme extends PolyhedronForme>(
  endFacetsToMorph: GetFacets<Forme> = (forme) => forme.geom.faces,
  startFacesToMorph: GetFaces<Forme> = (forme) => forme.geom.faces,
) {
  return function getMorphedVertices(start: Forme, end: Forme) {
    const facePairs = getFacetPairs(
      startFacesToMorph(start),
      endFacetsToMorph(end),
    )

    // create a map from the initial vertices to the end vertices
    const mapping: Vertex[] = []
    for (const [face, facet] of facePairs) {
      for (const [v1, v2] of getVertexPairs(face, facet)) {
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
function getFacetPairs(start: Face[], end: (Face | Vertex)[]) {
  return end.map((facet) => {
    return [findFacePartner(facet, start), facet] as const
  })
}

// Find the partner facet
function findFacePartner(facet: Face | Vertex, candidates: Face[]) {
  return minBy(candidates, (face2) => {
    return facet.normal().angleTo(face2.normal())
  })!
}

function getVertexPairs(startFace: Face, endFacet: Face | Vertex) {
  if (endFacet instanceof Vertex) {
    return startFace.vertices.map((v) => [v, endFacet])
  }
  const partnerIndex = getPartnerVertexIndex(startFace, endFacet)
  return startFace.vertices.map((v, i) => {
    return [v, getCyclic(endFacet.vertices, i + partnerIndex)] as [
      Vertex,
      Vertex,
    ]
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
