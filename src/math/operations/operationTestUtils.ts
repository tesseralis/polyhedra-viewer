import { vecEquals, PRECISION_DIGITS, Vec3D } from "math/geom"
import { Polyhedron } from "math/polyhedra"
import Operation, { OpResult } from "./Operation"
import PolyhedronForme from "math/formes/PolyhedronForme"
import { getGeometry } from "math/operations/operationUtils"
import { getSpecs2 } from "data/specs/getSpecs"
import createForme from "math/formes/createForme"
const { PI } = Math

// FIXME rename and consolidate these functions
export function makeApplyTo(operation: Operation<any>) {
  return function (name: string, value: boolean = true) {
    const specs = getSpecs2(name)
    const geom = getGeometry(specs)
    const forme = createForme(specs, geom)
    expect(operation.canApplyTo(forme)).toEqual(value)
  }
}

export function makeHasOptions(operation: Operation<any>) {
  return function (name: string, value: boolean = true) {
    const specs = getSpecs2(name)
    const geom = getGeometry(specs)
    const forme = createForme(specs, geom)
    expect(operation.hasOptions(forme)).toEqual(value)
  }
}

function expectCRFPolyhedron(polyhedron: Polyhedron) {
  const expectedSideLength = polyhedron.edgeLength()
  for (const edge of polyhedron.edges) {
    const sideLength: number = edge.length()
    // Check that all side lengths are defined
    expect(sideLength).not.toBeNaN()
    // Check that side lengths are all equal
    expect(sideLength).toBeCloseTo(expectedSideLength, PRECISION_DIGITS)
    // Make sure the whole thing is convex
    expect(edge.dihedralAngle()).toBeLessThan(PI)
  }

  // Make sure all faces are facing the right way
  const centroid = polyhedron.centroid()
  for (const face of polyhedron.faces) {
    const faceCentroid = face.centroid()
    const normal = face.normal()
    const expectedNormal = faceCentroid.sub(centroid)
    expect(normal.angleBetween(expectedNormal, true) || 0).toBeLessThan(PI / 2)
  }
}

function includesToPrecision(array: Vec3D[], value: Vec3D) {
  return array.some((v) => vecEquals(v, value))
}

// TODO figure out some not n-squared test for this
function expectVerticesMatch(test: Vec3D[], ref: Vec3D[]) {
  expect(test).toSatisfyAll((vec) => includesToPrecision(ref, vec))
}

// These operations behave badly and are banned :(
// FIXME we should be able to delete naughtyOps
const naughtyOps = ["gyrate"]

function expectValidAnimationData(
  opName: string,
  opResult: OpResult,
  original: Polyhedron,
) {
  const { result, animationData } = opResult
  expect(animationData).toBeDefined()
  const { start, endVertices } = animationData!
  if (opName !== "augment") {
    const startVertices = start.vertices.map((v) => v.vec)
    expectVerticesMatch(
      startVertices,
      original.vertices.map((v) => v.vec),
    )
  }
  if (opName !== "diminish") {
    expectVerticesMatch(
      endVertices.map((v) => new Vec3D(...v)),
      result.geom.vertices.map((v) => v.vec),
    )
  }
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
  original: PolyhedronForme,
  args: any,
) {
  const opResult = op.apply(original, args)
  if (naughtyOps.includes(op.name)) {
    // For augment, diminish, and gyrate, check if the end result is valid
    expectValidPolyhedron(opResult.result.geom)
  } else {
    // All other operations are implemented as OpPairs that use a reference,
    // so the results are guaranteed to be valid
    expectValidAnimationData(op.name, opResult, original.geom)
  }
  return opResult
}
