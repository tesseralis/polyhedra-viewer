import { vecEquals, Vector3 } from "math/geom"
import { Polyhedron } from "math/polyhedra"
import Operation, { OpResult } from "./Operation"
import PolyhedronForme from "math/formes/PolyhedronForme"
import { getGeometry } from "math/operations/operationUtils"
import { getSpecs } from "specs"
import createForme from "math/formes/createForme"

interface OpTestCases {
  pass: string[]
  fail: string[]
}

export function validateOpInputs(
  operation: Operation<any>,
  { pass, fail }: OpTestCases,
) {
  function canApplyTo(name: string) {
    const specs = getSpecs(name)
    const geom = getGeometry(specs)
    const forme = createForme(specs, geom)
    return operation.canApplyTo(forme)
  }
  for (const name of pass) {
    expect(name).toSatisfy(canApplyTo)
  }
  for (const name of fail) {
    expect(name).not.toSatisfy(canApplyTo)
  }
}

export function validateHasOptions(
  operation: Operation<any>,
  { pass, fail }: OpTestCases,
) {
  function hasOptions(name: string) {
    const specs = getSpecs(name)
    const geom = getGeometry(specs)
    const forme = createForme(specs, geom)
    return operation.hasOptions(forme)
  }
  for (const name of pass) {
    expect(name).toSatisfy(hasOptions)
  }
  for (const name of fail) {
    expect(name).not.toSatisfy(hasOptions)
  }
}

function includesToPrecision(array: Vector3[], value: Vector3) {
  return array.some((v) => vecEquals(v, value))
}

// TODO figure out some not n-squared test for this
function expectVerticesMatch(test: Vector3[], ref: Vector3[]) {
  for (const vec of test) {
    expect(vec).toSatisfy((vec) => includesToPrecision(ref, vec))
  }
  // expect(test).toSatisfyAll((vec) => includesToPrecision(ref, vec))
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
      endVertices.map((v) => new Vector3(...v)),
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
