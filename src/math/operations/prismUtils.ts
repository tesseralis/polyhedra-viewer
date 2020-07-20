import { maxBy, uniqBy } from "lodash-es"
import { Polyhedron, Cap } from "math/polyhedra"
import { isInverse } from "math/geom"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import Prismatic from "data/specs/Prismatic"

function getOppositeCaps(polyhedron: Polyhedron) {
  const caps = Cap.getAll(polyhedron)
  for (const cap of caps) {
    const cap2 = caps.find((cap2) => isInverse(cap.normal(), cap2.normal()))
    if (cap2) return [cap, cap2]
  }
  throw new Error(`Could not find opposite caps`)
}

function getOppositePrismFaces(specs: Prismatic, polyhedron: Polyhedron) {
  const face1 = polyhedron.faceWithNumSides(specs.data.base)
  const face2 = polyhedron.faces.find(
    (f) =>
      f.numSides === face1.numSides && isInverse(face1.normal(), f.normal()),
  )!
  return [face1, face2]
}

// Get information for figuring out how to twist or shorten a polyhedron
export function getOppositeFacets(
  specs: PolyhedronSpecs,
  polyhedron: Polyhedron,
) {
  if (specs.isPrismatic()) {
    return getOppositePrismFaces(specs, polyhedron)
  }
  if (!specs.isCapstone()) {
    throw new Error(`Invalid spec provided: ${specs.name()}`)
  }
  if (specs.isBi()) {
    return getOppositeCaps(polyhedron)
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
  )!
  return [face, cap]
}
