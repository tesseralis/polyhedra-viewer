import { mapValues } from "lodash-es"

import { getAllSpecs } from "data/specs/getSpecs"
import { Polygon } from "data/polygons"
import { Vec3D, vec, PRECISION } from "math/geom"
import { Polyhedron, Face, VertexArg, normalizeVertex } from "math/polyhedra"
import { deduplicateVertices } from "./operationUtils"
import { Point } from "types"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"

type SelectState = "selected" | "selectable" | undefined

export interface AnimationData {
  start: Polyhedron
  endVertices: Point[]
  startColors: Polygon[]
  endColors: Polygon[]
}

export interface OpResult {
  result: Polyhedron
  animationData?: AnimationData
}

interface PartialOpResult {
  result?: Polyhedron
  animationData?: {
    start: Polyhedron
    endVertices: VertexArg[]
  }
}

type OpResultArg = PartialOpResult | Polyhedron

interface SolidArgs<Specs extends PolyhedronSpecs> {
  specs: Specs
  geom: Polyhedron
}

interface OpArgs<Options extends {}, Specs extends PolyhedronSpecs> {
  canApplyTo(info: PolyhedronSpecs): info is Specs

  hasOptions?(info: Specs): boolean

  isPreferredSpec?(info: Specs, options: Options): boolean

  apply(
    solid: SolidArgs<Specs>,
    options: Options,
    result: Polyhedron,
  ): OpResultArg

  allOptions?(
    solid: SolidArgs<Specs>,
    optionName: keyof Options,
  ): Options[typeof optionName][]

  allOptionCombos?(solid: SolidArgs<Specs>): Generator<Options>

  getResult(solid: SolidArgs<Specs>, options: Options): PolyhedronSpecs

  hitOption?: keyof Options

  getHitOption?(
    solid: SolidArgs<Specs>,
    hitPnt: Vec3D,
    options: Partial<Options>,
  ): Partial<Options>

  defaultOptions?(info: Specs): Partial<Options>

  faceSelectionStates?(solid: SolidArgs<Specs>, options: Options): SelectState[]
}

type OperationArg = keyof OpArgs<any, any>
const methodDefaults = {
  getHitOption: {},
  hasOptions: false,
  allOptionCombos: [null],
  isPreferredSpec: true,
  faceSelectionStates: [],
  defaultOptions: {},
}

// TODO get this to return the correct type
function fillDefaults<Options extends {}, Specs extends PolyhedronSpecs>(
  op: OpArgs<Options, Specs>,
): Required<OpArgs<Options, Specs>> {
  return {
    ...mapValues(
      methodDefaults,
      (fnDefault, fn: OperationArg) => op[fn] ?? (() => fnDefault),
    ),
    ...op,
  } as Required<OpArgs<Options, Specs>>
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

function normalizeOpResult(opResult: OpResultArg, newName: string): OpResult {
  if (opResult instanceof Polyhedron) {
    return { result: deduplicateVertices(opResult).withName(newName) }
  }
  const { result, animationData } = opResult
  const { start, endVertices } = animationData!

  const end = start.withVertices(endVertices)
  const normedResult = result ?? deduplicateVertices(end)

  // Populate the how the faces in the start and end vertices should be colored
  const startColors = getFaceColors(start)
  const endColors = getFaceColors(end)

  return {
    result: normedResult.withName(newName),
    animationData: {
      start,
      endVertices: endVertices.map(normalizeVertex),
      startColors: arrayDefaults(startColors, endColors),
      endColors: arrayDefaults(endColors, startColors),
    },
  }
}

export default class Operation<
  Options extends {} = {},
  Specs extends PolyhedronSpecs = PolyhedronSpecs
> {
  name: string
  hitOption: keyof Options
  private opArgs: Required<OpArgs<Options, Specs>>

  constructor(name: string, opArgs: OpArgs<Options, Specs>) {
    this.name = name
    this.opArgs = fillDefaults(opArgs)
    this.hitOption = this.opArgs.hitOption
  }

  private *validSpecs(polyhedron: Polyhedron): Generator<Specs> {
    for (const specs of getAllSpecs(polyhedron.name)) {
      if (this.opArgs.canApplyTo(specs)) {
        yield specs
      }
    }
  }

  private getValidSpecs(polyhedron: Polyhedron) {
    return [...this.validSpecs(polyhedron)]
  }

  private getSolidArgs(polyhedron: Polyhedron) {
    // TODO think of situations where just using the first entry won't work
    return { specs: this.getValidSpecs(polyhedron)[0], geom: polyhedron }
  }

  apply(geom: Polyhedron, options: Options) {
    const specs = this.getValidSpecs(geom).find((info) =>
      this.opArgs.isPreferredSpec(info, options),
    )
    if (!specs)
      throw new Error(`Could not find specs for polyhedron ${geom.name}`)

    // get the next polyhedron name
    const next = this.opArgs.getResult!(
      { specs, geom },
      options ?? {},
    ).canonicalName()

    // Get the actual operation result
    const opResult = this.opArgs.apply(
      { specs, geom },
      options ?? {},
      Polyhedron.get(next),
    )
    return normalizeOpResult(opResult, next)
  }

  getHitOption(geom: Polyhedron, hitPnt: Point, options: Options) {
    return this.opArgs.getHitOption(
      this.getSolidArgs(geom),
      vec(hitPnt),
      options,
    )
  }

  canApplyTo(polyhedron: Polyhedron) {
    return this.getValidSpecs(polyhedron).length > 0
  }

  hasOptions(polyhedron: Polyhedron) {
    return this.getValidSpecs(polyhedron).some(this.opArgs.hasOptions!)
  }

  allOptions(polyhedron: Polyhedron, optionName: keyof Options) {
    return this.opArgs.allOptions(this.getSolidArgs(polyhedron), optionName)
  }

  *allOptionCombos(geom: Polyhedron) {
    for (const specs of this.getValidSpecs(geom)) {
      yield* this.opArgs.allOptionCombos({ specs, geom })
    }
  }

  defaultOptions(polyhedron: Polyhedron) {
    return this.opArgs.defaultOptions(this.getValidSpecs(polyhedron)[0])
  }

  faceSelectionStates(geom: Polyhedron, options: Options) {
    return this.opArgs.faceSelectionStates(this.getSolidArgs(geom), options)
  }
}
