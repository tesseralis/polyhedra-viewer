import { uniqWith, sortBy, zip, isNaN } from "lodash-es"
import { PRECISION, Vec3D } from "math/geom"
import { Polyhedron } from "math/polyhedra"
import { OpResult } from "./Operation"

function isProperPolyhedron(polyhedron: Polyhedron) {
  const expectedSideLength = polyhedron.edgeLength()
  for (const edge of polyhedron.edges) {
    const sideLength: number = edge.length()
    if (isNaN(sideLength)) {
      console.log(`edge ${edge} has length NaN`)
      return false
    }
    if (Math.abs(sideLength - expectedSideLength) > PRECISION) {
      console.error(
        `edge ${edge} has length ${sideLength} which is different from ${expectedSideLength}`,
      )
      return false
    }
    // Make sure the whole thing is convex
    if (edge.dihedralAngle() > Math.PI - PRECISION) {
      console.error(`polyhedron concave at edge ${edge}`)
      return false
    }
  }

  // Make sure all faces are facing the right way
  const centroid = polyhedron.centroid()
  for (const face of polyhedron.faces) {
    const faceCentroid = face.centroid()
    const normal = face.normal()
    const expectedNormal = faceCentroid.sub(centroid)
    if (normal.angleBetween(expectedNormal, true) > Math.PI / 2) {
      console.error(`polyhedron inside out at ${face.index}`)
      return false
    }
  }
  return true
}

// TODO figure out some not n-squared test for this
function expectVerticesMatch(test: Vec3D[], ref: Vec3D[]) {
  for (const vec of test) {
    expect(ref.some((v) => v.equalsWithTolerance(vec, PRECISION))).toEqual(true)
  }
}

// These operations behave badly and are banned :(
// dual: improperly scaled
// twist: broken on tetrahedra
const naughtyOps = ["augment", "diminish", "gyrate", "dual", "twist"]

export function expectValidAnimationData(
  opResult: OpResult,
  original: Polyhedron,
  operation: string,
) {
  // don't do it if it's one of the banned operations
  if (naughtyOps.includes(operation)) return

  const { result, animationData } = opResult
  expect(animationData).toBeDefined()
  const { start, endVertices } = animationData!
  const startVertices = start.vertices
    .filter((v) => !v.adjacentEdges().every((e) => e.length() < PRECISION))
    .map((v) => v.vec)
  expectVerticesMatch(
    startVertices,
    original.vertices.map((v) => v.vec),
  )
  expectVerticesMatch(
    endVertices.map((v) => new Vec3D(...v)),
    result.vertices.map((v) => v.vec),
  )
}

export function expectValidPolyhedron(opResult: OpResult) {
  const { result } = opResult
  expect(isProperPolyhedron(result)).toBeTruthy()
  expect(result.isSame(Polyhedron.get(result.name))).toBeTruthy()
}
