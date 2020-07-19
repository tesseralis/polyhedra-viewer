import { maxBy, isEqual, uniqBy, countBy } from "lodash-es"
import { Polyhedron, Cap, FaceLike } from "math/polyhedra"
import { isInverse } from "math/geom"

// Get antiprism height of a unit antiprism with n sides
export function antiprismHeight(n: number) {
  const sec = 1 / Math.cos(Math.PI / (2 * n))
  return Math.sqrt(1 - (sec * sec) / 4)
}

// TODO deduplicate with snub polyhedra if possible
export function getChirality(polyhedron: Polyhedron) {
  const [cap1, cap2] = Cap.getAll(polyhedron)
  const boundary = cap1.boundary()
  const isCupolaRotunda = cap1.type !== cap2.type

  const nonTriangleFace = boundary.edges.find((e) => e.face.numSides !== 3)!
  const rightFaceAcross = nonTriangleFace.twin().prev().twin().next().twin()
    .face
  // I'm pretty sure this is the same logic as in augment
  if (isCupolaRotunda) {
    return rightFaceAcross.numSides !== 3 ? "right" : "left"
  }
  return rightFaceAcross.numSides !== 3 ? "left" : "right"
}

function getOppositeCaps(polyhedron: Polyhedron) {
  const caps = Cap.getAll(polyhedron)
  for (const cap of caps) {
    const cap2 = caps.find((cap2) => isInverse(cap.normal(), cap2.normal()))
    if (cap2) return [cap, cap2]
  }
  return undefined
}

function getOppositePrismFaces(polyhedron: Polyhedron) {
  const face1 = maxBy(
    polyhedron.faces.filter((face) => {
      const faceCounts = countBy(
        face.vertexAdjacentFaces().filter((f) => !f.equals(face)),
        "numSides",
      )
      return (
        isEqual(faceCounts, { "4": face.numSides }) ||
        isEqual(faceCounts, { "3": 2 * face.numSides })
      )
    }),
    "numSides",
  )
  if (!face1) return undefined

  const face2 = polyhedron.faces.find(
    (face2) =>
      face1.numSides === face2.numSides &&
      isInverse(face1.normal(), face2.normal()),
  )
  if (face2) return [face1, face2]
  return undefined
}

interface AdjustInfo {
  vertexSets: any
  readonly boundary: FaceLike
}

// Get information for figuring out how to twist or shorten a polyhedron
export function getAdjustInformation(polyhedron: Polyhedron): AdjustInfo {
  const oppositePrismFaces = getOppositePrismFaces(polyhedron)
  if (oppositePrismFaces) {
    return {
      vertexSets: oppositePrismFaces,
      boundary: oppositePrismFaces[0],
    }
  }
  const oppositeCaps = getOppositeCaps(polyhedron)
  if (oppositeCaps) {
    // This is an elongated bi-cap
    return {
      vertexSets: oppositeCaps,
      boundary: oppositeCaps[0].boundary(),
    }
  }

  // Otherwise it's an elongated single cap.
  // Find the face *first* (in case it's a diminished icosahedron)
  // then find the cap that's opposite of it
  const faces = polyhedron.faces.filter((face) => {
    return uniqBy(face.adjacentFaces(), "numSides").length === 1
  })
  const face = maxBy(faces, "numSides")!
  const cap = Cap.getAll(polyhedron).find((cap) =>
    isInverse(cap.normal(), face.normal()),
  )
  return {
    vertexSets: [face, cap],
    boundary: face,
  }
}
