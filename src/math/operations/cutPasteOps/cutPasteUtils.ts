import { getSingle } from "utils"
import { Cap, Polyhedron } from "math/polyhedra"
import { isInverse } from "math/geom"

type Relation = Record<string, any>

export function getCupolaGyrate(cap: Cap) {
  const isOrtho = cap.boundary().edges.every((edge) => {
    const [n1, n2] = edge.adjacentFaces().map((f) => f.numSides)
    return (n1 === 4) === (n2 === 4)
  })
  return isOrtho ? "ortho" : "gyro"
}

export function getCapAlignment(polyhedron: Polyhedron, cap: Cap) {
  const isRhombicosidodecahedron = cap.type === "cupola"
  const orthoCaps = isRhombicosidodecahedron
    ? Cap.getAll(polyhedron).filter((cap) => getCupolaGyrate(cap) === "ortho")
    : []

  const otherNormal =
    orthoCaps.length > 0
      ? getSingle(orthoCaps).boundary().normal()
      : polyhedron.largestFace().normal()

  return isInverse(cap.normal(), otherNormal) ? "para" : "meta"
}

export function getGyrateDirection(cap: Cap) {
  return getCupolaGyrate(cap) === "ortho" ? "back" : "forward"
}
