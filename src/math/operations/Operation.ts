import { pickBy, mapValues, isMatch, isNil } from "lodash-es"

import { Polygon } from "data/polygons"
import { Vec3D, vec, vecEquals } from "math/geom"
import { Polyhedron, Face, VertexArg, normalizeVertex } from "math/polyhedra"
import { deduplicateVertices } from "./operationUtils"
import { Point } from "types"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import PolyhedronForme from "math/formes/PolyhedronForme"
import createForme from "math/formes/createForme"
import { find } from "utils"

type SelectState = "selected" | "selectable" | undefined

export interface AnimationData {
  start: Polyhedron
  endVertices: Point[]
  startColors: Polygon[]
  endColors: Polygon[]
}

export interface OpResult {
  result: PolyhedronForme
  animationData: AnimationData
}

interface PartialOpResult {
  result?: Polyhedron
  animationData: {
    start: Polyhedron
    endVertices: VertexArg[]
  }
}

export interface SolidArgs<Specs extends PolyhedronSpecs> {
  specs: Specs
  geom: Polyhedron
}

export interface GraphEntry<Specs, Opts> {
  start: Specs
  end: Specs
  options?: Opts
}

export interface OpArgs<Options extends {}, Forme extends PolyhedronForme> {
  graph(): Generator<GraphEntry<Forme["specs"], Options>>

  // FIXME!! this needs better typing, e.g. use two different generics for each type of option
  toGraphOpts(solid: Forme, opts: Partial<Options>): Options

  hasOptions?(info: Forme["specs"]): boolean

  apply(solid: Forme, options: Options): PartialOpResult

  allOptions?(
    solid: Forme,
    optionName: keyof Options,
  ): readonly Options[typeof optionName][]

  allOptionCombos?(solid: Forme): Generator<Options>

  hitOption?: keyof Options

  getHitOption?(
    solid: Forme,
    hitPnt: Vec3D,
    options: Partial<Options>,
  ): Partial<Options>

  defaultOptions?(info: Forme["specs"]): Partial<Options>

  faceSelectionStates?(solid: Forme, options: Options): SelectState[]
}

type OperationArg = keyof OpArgs<any, any>
const methodDefaults = {
  getHitOption: {},
  faceSelectionStates: [],
  defaultOptions: {},
}

// TODO get this to return the correct type
function fillDefaults<Options extends {}, Forme extends PolyhedronForme>(
  op: OpArgs<Options, Forme>,
): Required<OpArgs<Options, Forme>> {
  return {
    ...mapValues(
      methodDefaults,
      (fnDefault, fn: OperationArg) => op[fn] ?? (() => fnDefault),
    ),
    ...op,
  } as Required<OpArgs<Options, Forme>>
}

function getCoplanarFaces(polyhedron: Polyhedron) {
  const found: Face[] = []
  const pairs: [Face, Face][] = []
  polyhedron.faces.forEach((f1) => {
    if (f1.inSet(found) || !f1.isValid()) return

    f1.adjacentFaces().forEach((f2) => {
      if (!f2 || !f2.isValid()) return
      if (vecEquals(f1.normal(), f2.normal())) {
        pairs.push([f1, f2])
        found.push(f1)
        found.push(f2)
        return
      }
    })
  })
  return pairs
}

function getFaceColors(polyhedron: Polyhedron): Polygon[] {
  const pairs = getCoplanarFaces(polyhedron)
  const mapping: Record<number, Polygon> = {}
  for (const [f1, f2] of pairs) {
    const numSides = (f1.numSides + f2.numSides - 2) as Polygon
    mapping[f1.index] = numSides
    mapping[f2.index] = numSides
  }

  return polyhedron.faces.map(
    (face) => mapping[face.index] ?? face.numUniqueSides(),
  )
}

function arrayDefaults<T>(first: T[], second: T[]) {
  return first.map((item, i) => item ?? second[i])
}

function normalizeOpResult(
  opResult: PartialOpResult,
  newSpecs: PolyhedronSpecs,
): OpResult {
  const { result, animationData } = opResult
  const { start, endVertices } = animationData

  const end = start.withVertices(endVertices)
  const normedResult = result ?? deduplicateVertices(end)

  // Populate the how the faces in the start and end vertices should be colored
  const startColors = getFaceColors(start)
  const endColors = getFaceColors(end)

  return {
    result: createForme(
      newSpecs,
      normedResult.withName(newSpecs.canonicalName()),
    ),
    animationData: {
      start,
      endVertices: endVertices.map(normalizeVertex),
      startColors: arrayDefaults(startColors, endColors),
      endColors: arrayDefaults(endColors, startColors),
    },
  }
}

export default class Operation<Options extends {} = {}> {
  name: string
  graph: GraphEntry<PolyhedronSpecs, Options>[]
  hitOption: keyof Options
  private opArgs: Required<OpArgs<Options, PolyhedronForme>>

  constructor(name: string, opArgs: OpArgs<Options, PolyhedronForme>) {
    this.name = name
    this.opArgs = fillDefaults(opArgs)
    this.graph = [...this.opArgs.graph()]
    this.hitOption = this.opArgs.hitOption
  }

  apply(solid: PolyhedronForme, options: Options) {
    // get the next polyhedron name
    const next = this.getResult(solid, options)

    // Get the actual operation result
    const opResult = this.opArgs.apply(solid, options ?? {})
    return normalizeOpResult(opResult, next)
  }

  getHitOption(solid: PolyhedronForme, hitPnt: Point, options: Options) {
    return this.opArgs.getHitOption(solid, vec(hitPnt), options)
  }

  canApplyTo(solid: PolyhedronForme) {
    return this.graph.some((entry) => entry.start.equals(solid.specs))
  }

  getEntry(solid: PolyhedronForme, options: Options) {
    // FIXME!! optimize this and make error checking better
    // e.g. make it easier to type.
    return find(
      this.graph,
      (entry) =>
        entry.start.equals(solid.specs) &&
        isMatch(
          entry.options ?? {},
          pickBy(this.opArgs.toGraphOpts(solid, options), (opt) => !isNil(opt)),
        ),
    )
  }

  getEntries(solid: PolyhedronForme) {
    return this.graph.filter((entry) => entry.start.equals(solid.specs))
  }

  getResult(solid: PolyhedronForme, options: Options) {
    return this.getEntry(solid, options).end
  }

  hasOptions(solid: PolyhedronForme) {
    if (this.opArgs.hasOptions) {
      return this.opArgs.hasOptions(solid.specs)
    }
    return this.getEntries(solid).length > 1
  }

  allOptions(solid: PolyhedronForme, optionName: keyof Options) {
    return this.opArgs.allOptions(solid, optionName)
  }

  *allOptionCombos(solid: PolyhedronForme) {
    if (this.opArgs.allOptionCombos) {
      yield* this.opArgs.allOptionCombos(solid)
    } else {
      for (const entry of this.getEntries(solid)) {
        yield entry.options
      }
    }
  }

  defaultOptions(solid: PolyhedronForme) {
    return this.opArgs.defaultOptions(solid.specs)
  }

  faceSelectionStates(solid: PolyhedronForme, options: Options) {
    return this.opArgs.faceSelectionStates(solid, options)
  }
}

export function makeOperation<
  Options extends {} = {},
  Forme extends PolyhedronForme = PolyhedronForme
>(name: string, opArgs: OpArgs<Options, Forme>) {
  return new Operation(name, opArgs)
}
