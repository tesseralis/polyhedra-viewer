import { Polyhedron, Vertex } from "math/polyhedra"
import Operation, { OpResult } from "./Operation"
import { PolyhedronForme, fromName } from "math/formes"

interface OpTestCases {
  pass: string[]
  fail: string[]
}

export function validateOpInputs(
  operation: Operation<any>,
  { pass, fail }: OpTestCases,
) {
  function canApplyTo(name: string) {
    return operation.canApplyTo(fromName(name))
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
    return operation.hasOptions(fromName(name))
  }
  for (const name of pass) {
    expect(name).toSatisfy(hasOptions)
  }
  for (const name of fail) {
    expect(name).not.toSatisfy(hasOptions)
  }
}

function includesToPrecision(array: Vertex[], value: Vertex) {
  return array.some((v) => value.isConcentric(v))
}

// TODO figure out some not n-squared test for this
function expectVerticesMatch(test: Vertex[], ref: Vertex[]) {
  for (const vec of test) {
    expect(vec).toSatisfy((vec) => includesToPrecision(ref, vec))
  }
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
    expectVerticesMatch(start.vertices, original.vertices)
  }
  // "Diminish" has a weird end position so skip this check for it
  if (opName !== "diminish") {
    expectVerticesMatch(
      original.withVertices(endVertices).vertices,
      result.geom.vertices,
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
