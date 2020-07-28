import { mapValues } from "lodash-es"

import { Polygon } from "data/polygons"
import { Vec3D, vec, PRECISION } from "math/geom"
import { Polyhedron, Face, VertexArg, normalizeVertex } from "math/polyhedra"
import { deduplicateVertices } from "./operationUtils"
import { Point } from "types"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import PolyhedronForme from "math/formes/PolyhedronForme"

type SelectState = "selected" | "selectable" | undefined

type SolidForme = PolyhedronForme<PolyhedronSpecs>

export interface AnimationData {
  start: Polyhedron
  endVertices: Point[]
  startColors: Polygon[]
  endColors: Polygon[]
}

export interface OpResult {
  result: SolidForme
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

// export type PolyhedronForme = SolidArgs<PolyhedronSpecs>

export interface OpArgs<
  Options extends {},
  Specs extends PolyhedronSpecs,
  Forme extends PolyhedronForme<Specs>
> {
  canApplyTo(info: PolyhedronSpecs): boolean

  hasOptions?(info: Specs): boolean

  apply(solid: Forme, options: Options): PartialOpResult

  allOptions?(
    solid: Forme,
    optionName: keyof Options,
  ): Options[typeof optionName][]

  allOptionCombos?(solid: Forme): Generator<Options>

  getResult(solid: Forme, options: Options): PolyhedronSpecs

  hitOption?: keyof Options

  getHitOption?(
    solid: Forme,
    hitPnt: Vec3D,
    options: Partial<Options>,
  ): Partial<Options>

  defaultOptions?(info: Specs): Partial<Options>

  faceSelectionStates?(solid: Forme, options: Options): SelectState[]
}

type OperationArg = keyof OpArgs<any, any, any>
const methodDefaults = {
  getHitOption: {},
  hasOptions: false,
  allOptionCombos: [null],
  faceSelectionStates: [],
  defaultOptions: {},
}

// TODO get this to return the correct type
function fillDefaults<
  Options extends {},
  Specs extends PolyhedronSpecs,
  Forme extends PolyhedronForme<Specs>
>(op: OpArgs<Options, Specs, Forme>): Required<OpArgs<Options, Specs, Forme>> {
  return {
    ...mapValues(
      methodDefaults,
      (fnDefault, fn: OperationArg) => op[fn] ?? (() => fnDefault),
    ),
    ...op,
  } as Required<OpArgs<Options, Specs, Forme>>
}

function getCoplanarFaces(polyhedron: Polyhedron) {
  const found: Face[] = []
  const pairs: [Face, Face][] = []
  polyhedron.faces.forEach((f1) => {
    if (f1.inSet(found) || !f1.isValid()) return

    f1.adjacentFaces().forEach((f2) => {
      if (!f2 || !f2.isValid()) return
      if (f1.normal().equalsWithTolerance(f2.normal(), PRECISION)) {
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
    result: {
      geom: normedResult.withName(newSpecs.name()),
      specs: newSpecs,
    },
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
  hitOption: keyof Options
  private opArgs: Required<OpArgs<Options, PolyhedronSpecs, SolidForme>>

  constructor(
    name: string,
    opArgs: OpArgs<Options, PolyhedronSpecs, SolidForme>,
  ) {
    this.name = name
    this.opArgs = fillDefaults(opArgs)
    this.hitOption = this.opArgs.hitOption
  }

  apply(solid: SolidForme, options: Options) {
    // get the next polyhedron name
    const next = this.opArgs.getResult!(solid, options ?? {})

    // Get the actual operation result
    const opResult = this.opArgs.apply(solid, options ?? {})
    return normalizeOpResult(opResult, next)
  }

  getHitOption(solid: SolidForme, hitPnt: Point, options: Options) {
    return this.opArgs.getHitOption(solid, vec(hitPnt), options)
  }

  canApplyTo(solid: SolidForme) {
    return this.opArgs.canApplyTo(solid.specs)
  }

  hasOptions(solid: SolidForme) {
    return this.opArgs.hasOptions(solid.specs)
  }

  allOptions(solid: SolidForme, optionName: keyof Options) {
    return this.opArgs.allOptions(solid, optionName)
  }

  *allOptionCombos(solid: SolidForme) {
    yield* this.opArgs.allOptionCombos(solid)
  }

  defaultOptions(solid: SolidForme) {
    return this.opArgs.defaultOptions(solid.specs)
  }

  faceSelectionStates(solid: SolidForme, options: Options) {
    return this.opArgs.faceSelectionStates(solid, options)
  }
}

export function makeOperation<
  Options extends {} = {},
  Specs extends PolyhedronSpecs = PolyhedronSpecs,
  Forme extends PolyhedronForme<Specs> = PolyhedronForme<Specs>
>(name: string, opArgs: OpArgs<Options, Specs, Forme>) {
  return new Operation(name, opArgs)
}
