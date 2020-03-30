import { mapValues, isEmpty, uniq } from "lodash-es"

import operationGraph from "data/graph/operationGraph"
import { Vec3D, vec, PRECISION } from "math/geom"
import { Polyhedron, Vertex, VertexArg, normalizeVertex } from "math/polyhedra"
import { removeExtraneousVertices } from "./operationUtils"
import { Point } from "types"

type SelectState = "selected" | "selectable" | undefined

export interface AnimationData {
  start: Polyhedron
  endVertices: Point[]
}

export interface OperationResult {
  result: Polyhedron
  animationData?: AnimationData
}

interface BaseOperation<Options extends {}> {
  optionTypes: (keyof Options)[]

  hitOption?: keyof Options

  /**
   * Test utility.
   * @return all possible option permutations for applying this operation to the given polyhedron.
   */
  allOptionCombos(polyhedron: Polyhedron): Options[]

  /**
   * Given an application of an operation to a given polyhedron with the given options,
   * @return an array mapping face indices to selection states (selectable, selected, or none).
   */
  faceSelectionStates(polyhedron: Polyhedron, options: Options): SelectState[]

  /**
   * @return all the options for the given option name.
   */
  allOptions(
    polyhedron: Polyhedron,
    optionName: keyof Options,
  ): Options[typeof optionName][]

  /**
   * Return the default selected apply options when an operation is
   * selected on a polyhedron.
   */
  defaultOptions(polyhedron: Polyhedron): Partial<Options>
}

export interface Operation<Options extends {}> extends BaseOperation<Options> {
  name: string

  apply(polyhedron: Polyhedron, options: Options): OperationResult

  canApplyTo(polyhedron: Polyhedron): boolean

  getHitOption(polyhedron: Polyhedron, hitPnt: Point, options: Options): Options

  /**
   * @return whether this operation has multiple options for the given polyhedron.
   */
  hasOptions(polyhedron: Polyhedron): boolean
}

interface PartialOpResult {
  result?: Polyhedron
  animationData?: {
    start: Polyhedron
    endVertices: VertexArg[]
  }
}

interface OperationArgs<Options extends {}>
  extends Partial<BaseOperation<Options>> {
  apply(
    polyhedron: Polyhedron,
    options: Options,
    resultName: string,
  ): PartialOpResult | Polyhedron

  hasOptions?(polyhedron: Polyhedron): boolean

  resultsFilter?(
    polyhedron: Polyhedron,
    options: Partial<Options>,
    results: any[],
  ): object | undefined

  getHitOption?(
    polyhedron: Polyhedron,
    hitPnt: Vec3D,
    options: Options,
  ): Partial<Options>
}

type OperationArg = keyof OperationArgs<any>
const methodDefaults = {
  getHitOption: {},
  hasOptions: false,
  allOptionCombos: [null],
  resultsFilter: undefined,
  faceSelectionStates: [],
  defaultOptions: {},
}

export function getOpResults(solid: Polyhedron, opName: string) {
  return operationGraph.getPossibleResults(solid.name, opName)
}

// TODO get this to return the correct type
function fillDefaults<Options extends {}>(op: OperationArgs<Options>) {
  return {
    ...mapValues(
      methodDefaults,
      (fnDefault, fn: OperationArg) => op[fn] ?? (() => fnDefault),
    ),
    ...op,
  }
}

function normalizeOpResult(
  opResult: PartialOpResult | Polyhedron,
  newName: string,
): OperationResult {
  if (opResult instanceof Polyhedron) {
    return { result: deduplicateVertices(opResult).withName(newName) }
  }
  const { result, animationData } = opResult
  const { start, endVertices } = animationData!

  const normedResult =
    result ?? deduplicateVertices(start.withVertices(endVertices))

  return {
    result: normedResult.withName(newName),
    animationData: {
      start,
      endVertices: endVertices.map(normalizeVertex),
    },
  }
}

// Remove vertices (and faces) from the polyhedron when they are all the same
export function deduplicateVertices(polyhedron: Polyhedron) {
  // group vertex indices by same
  const unique: Vertex[] = []
  const oldToNew: Record<number, number> = {}

  polyhedron.vertices.forEach((v, vIndex) => {
    const match = unique.find((point) =>
      v.vec.equalsWithTolerance(point.vec, PRECISION),
    )
    if (match === undefined) {
      unique.push(v)
      oldToNew[vIndex] = vIndex
    } else {
      oldToNew[vIndex] = match.index
    }
  })

  if (isEmpty(oldToNew)) return polyhedron

  // replace vertices that are the same
  let newFaces = polyhedron.faces
    .map((face) => uniq(face.vertices.map((v) => oldToNew[v.index])))
    .filter((vIndices) => vIndices.length >= 3)

  // remove extraneous vertices
  return removeExtraneousVertices(polyhedron.withFaces(newFaces))
}

export default function makeOperation<Options extends {}>(
  name: string,
  op: OperationArgs<Options>,
): Operation<Options> {
  const withDefaults = fillDefaults(op)
  return {
    ...(withDefaults as any),
    name,
    apply(polyhedron, options) {
      // get the next polyhedron name
      const results = getOpResults(polyhedron, name)
      const searchOptions = withDefaults.resultsFilter!(
        polyhedron,
        options ?? {},
        results,
      )
      const next = operationGraph.getResult(
        polyhedron.name,
        name,
        searchOptions,
      )

      // Get the actual operation result
      const opResult = withDefaults.apply(polyhedron, options ?? {}, next)
      return normalizeOpResult(opResult, next)
    },
    getHitOption(polyhedron, hitPnt, options) {
      return withDefaults.getHitOption!(polyhedron, vec(hitPnt), options)
    },
    canApplyTo(polyhedron) {
      return operationGraph.canApply(polyhedron.name, name)
    },
  }
}
