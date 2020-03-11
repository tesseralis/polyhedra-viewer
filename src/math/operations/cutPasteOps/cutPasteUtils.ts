import { every } from "lodash"
import { getSingle } from "utils"
import { Cap, Polyhedron } from "math/polyhedra"
import { isInverse } from "math/geom"

type Relation = Record<string, any>

// true if the relation has multiple values that have that property
export const hasMultiple = (relations: Relation[], property: string) => {
  const set = new Set(relations.map(r => r[property]).filter(x => !!x))
  return set.size > 1
}

export function getCapAlignment(polyhedron: Polyhedron, cap: Cap) {
  const isRhombicosidodecahedron = cap.type === "cupola"
  const orthoCaps = isRhombicosidodecahedron
    ? Cap.getAll(polyhedron).filter(
        cap => getCupolaGyrate(polyhedron, cap) === "ortho",
      )
    : []

  const otherNormal =
    orthoCaps.length > 0
      ? getSingle(orthoCaps)
          .boundary()
          .normal()
      : polyhedron.largestFace().normal()

  return isInverse(cap.normal(), otherNormal) ? "para" : "meta"
}

export function getCupolaGyrate(polyhedron: Polyhedron, cap: Cap) {
  const isOrtho = every(cap.boundary().edges, edge => {
    const [n1, n2] = edge.adjacentFaces().map(f => f.numSides)
    return (n1 === 4) === (n2 === 4)
  })
  return isOrtho ? "ortho" : "gyro"
}

export function getGyrateDirection(polyhedron: Polyhedron, cap: Cap) {
  return getCupolaGyrate(polyhedron, cap) === "ortho" ? "back" : "forward"
}
