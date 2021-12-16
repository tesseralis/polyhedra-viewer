import { minBy, range } from "lodash-es"
import { getCyclic } from "lib/utils"
import { Face, Vertex } from "math/polyhedra"
import { isCodirectional } from "math/geom"
import { PolyhedronForme } from "math/formes"

type GetFaces<Forme> = (forme: Forme) => Face[]
type GetIsExact<Forme> = (forme: Forme) => boolean

/**
 * Return the expanded vertices of the polyhedron resized to the given distance-from-center
 * and rotated by the given angle
 */
export function getResizeFunction<Forme extends PolyhedronForme>(
  getFacesToMap: GetFaces<Forme>,
  getIsExact: GetIsExact<Forme> = () => true,
) {
  return function getResizedVertices(forme: Forme, result: Forme) {
    const isExact = getIsExact(forme)
    const facePairs = getFacePairs(
      forme.geom.faces,
      getFacesToMap(result),
      isExact,
    )

    // create a map from the initial vertices to the end vertices
    const mapping: Vertex[] = []
    for (const [f1, f2] of facePairs) {
      for (const [v1, v2] of getVertexPairs(f1, f2, isExact)) {
        mapping[v1.index] = v2
      }
    }
    const res = forme.geom.vertices.map((v) => {
      return mapping[v.index]
    })
    return res
  }
}

// Find the faces in the first set that map onto the second set
function getFacePairs(first: Face[], second: Face[], isSnub?: boolean) {
  return second.map((face) => {
    return [findFacePartner(face, first, isSnub), face]
  })
}

function findFacePartner(face: Face, candidates: Face[], isSnub?: boolean) {
  if (isSnub) {
    return minBy(candidates, (face2) => {
      return face.normal().angleTo(face2.normal())
    })!
  } else {
    const partner = candidates.find((face2) =>
      isCodirectional(face.normal(), face2.normal()),
    )
    if (!partner) {
      throw new Error("Something went wrong finding a partner face")
    }
    return partner
  }
}

function getVertexPairs(f1: Face, f2: Face, isSnub?: boolean) {
  const partnerIndex = getPartnerVertexIndex(f1, f2, isSnub)
  return f1.vertices.map((v, i) => {
    return [v, getCyclic(f2.vertices, i + partnerIndex)] as [Vertex, Vertex]
  })
}

function getPartnerVertexIndex(f1: Face, f2: Face, isSnub?: boolean) {
  const v0 = f1.vertices[0]
  if (isSnub) {
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
  const partnerIndex = f2.vertices.findIndex((v) =>
    isCodirectional(
      f1.centroid().clone().sub(v0.vec),
      f2.centroid().clone().sub(v.vec),
    ),
  )
  if (partnerIndex < 0) {
    throw new Error("Something went wrong finding a partner vertex")
  }
  return partnerIndex
}
