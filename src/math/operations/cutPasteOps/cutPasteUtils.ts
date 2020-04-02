import { getSingle } from "utils"
import { Cap, Polyhedron } from "math/polyhedra"
import { isInverse } from "math/geom"
import Capstone from "data/specs/Capstone"
import Composite from "data/specs/Composite"
import Elementary from "data/specs/Elementary"

export type CutPasteSpecs = Capstone | Composite | Elementary

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
