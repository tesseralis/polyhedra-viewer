import { mapValues } from "lodash-es"

import { getAllSpecs } from "data/specs/getSpecs"
import { Vec3D, vec } from "math/geom"
import { Polyhedron, VertexArg, normalizeVertex } from "math/polyhedra"
import { deduplicateVertices } from "./operationUtils"
import { Point } from "types"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"

type SelectState = "selected" | "selectable" | undefined

export interface AnimationData {
  start: Polyhedron
  endVertices: Point[]
}

interface OpResult {
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

function normalizeOpResult(opResult: OpResultArg, newName: string): OpResult {
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
