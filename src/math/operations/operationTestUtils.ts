import { vecEquals, PRECISION_DIGITS, Vec3D } from "math/geom"
import { Polyhedron } from "math/polyhedra"
import Operation, { OpResult } from "./Operation"
import PolyhedronForme from "math/formes/PolyhedronForme"
import { getGeometry } from "math/operations/operationUtils"
import { getSpecs2 } from "data/specs/getSpecs"
import createForme from "math/formes/createForme"

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

function includesToPrecision(array: Vec3D[], value: Vec3D) {
  return array.some((v) => vecEquals(v, value))
}

// TODO figure out some not n-squared test for this
function expectVerticesMatch(test: Vec3D[], ref: Vec3D[]) {
  expect(test).toSatisfyAll((vec) => includesToPrecision(ref, vec))
}

function expectValidAnimationData(
  opName: string,
  opResult: OpResult,
  original: Polyhedron,
) {
  const { result, animationData } = opResult
  expect(animationData).toBeDefined()
  const { start, endVertices } = animationData!
  // "Augment" has a weird start position so skip this check for it
  if (opName !== "augment") {
    const startVertices = start.vertices.map((v) => v.vec)
    expectVerticesMatch(
      startVertices,
      original.vertices.map((v) => v.vec),
    )
  }
  // "Diminish" has a weird end position so skip this check for it
  if (opName !== "diminish") {
    expectVerticesMatch(
      endVertices.map((v) => new Vec3D(...v)),
      result.geom.vertices.map((v) => v.vec),
    )
  }
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
  // All operations are implemented as OpPairs that use a reference,
  // so the results are guaranteed to be valid CRF polyhedra.
  // All we need to do is verify that the intermediate data
  // matches the start and end polyhedra.
  expectValidAnimationData(op.name, opResult, original.geom)
  return opResult
}
