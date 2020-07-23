import { PRECISION, PRECISION_DIGITS, Vec3D } from "math/geom"
import { Polyhedron } from "math/polyhedra"
import Operation, { OpResult } from "./Operation"

function expectCRFPolyhedron(polyhedron: Polyhedron) {
  const expectedSideLength = polyhedron.edgeLength()
  for (const edge of polyhedron.edges) {
    const sideLength: number = edge.length()
    // Check that all side lengths are defined
    expect(sideLength).not.toBeNaN()
    // Check that side lengths are all equal
    expect(sideLength).toBeCloseTo(expectedSideLength, PRECISION_DIGITS)
    // Make sure the whole thing is convex
    expect(edge.dihedralAngle()).toBeLessThan(Math.PI)
  }

  // Make sure all faces are facing the right way
  const centroid = polyhedron.centroid()
  for (const face of polyhedron.faces) {
    const faceCentroid = face.centroid()
    const normal = face.normal()
    const expectedNormal = faceCentroid.sub(centroid)
    expect(normal.angleBetween(expectedNormal, true) || 0).toBeLessThan(
      Math.PI / 2,
    )
  }
}

function includesToPrecision(array: Vec3D[], value: Vec3D) {
  return array.some((v) => v.equalsWithTolerance(value, PRECISION))
}

// TODO figure out some not n-squared test for this
function expectVerticesMatch(test: Vec3D[], ref: Vec3D[]) {
  expect(test).toSatisfyAll((vec) => includesToPrecision(ref, vec))
}

// These operations behave badly and are banned :(
const naughtyOps = ["augment", "diminish", "gyrate"]

function expectValidAnimationData(opResult: OpResult, original: Polyhedron) {
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

function expectValidPolyhedron(result: Polyhedron) {
  expectCRFPolyhedron(result)
  expect(result).toSatisfy((res) => res.isSame(Polyhedron.get(result.name)))
}

/**
 * Assert that the given operation applied to the given polyhedron returns
 * a valid polyhedron and valid intermediate forms.
 */
export function validateOperationApplication(
  op: Operation<any>,
  original: Polyhedron,
  args: any,
) {
  const opResult = op.apply(original, args)
  if (naughtyOps.includes(op.name)) {
    // For augment, diminish, and gyrate, check if the end result is valid
    expectValidPolyhedron(opResult.result)
  } else {
    // All other operations are implemented as OpPairs that use a reference,
    // so the results are guaranteed to be valid
    expectValidAnimationData(opResult, original)
  }
  return opResult
}
