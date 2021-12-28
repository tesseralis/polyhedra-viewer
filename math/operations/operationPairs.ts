import { isMatch, pickBy, minBy, range } from "lodash-es"
import { getCyclic } from "lib/utils"
import { PolyhedronSpecs } from "specs"
import { Face, Vertex } from "math/polyhedra"
import { OpArgs, GraphEntry as DirectedGraphEntry } from "./Operation"
import { Pose, alignPolyhedron, getGeometry } from "./operationUtils"
import BaseForme from "math/formes/BaseForme"
import { PolyhedronForme as Forme, createForme, FaceType } from "math/formes"
import { vecEquals } from "math/geom"
import { Appearance } from "components/ViewerPage/common/SolidScene/getFormeColors"

/**
 * Defines a pair of inverse operations based on the given parameters.
 * An operation pair is defined as a bijective mapping from the left entries to the right entries.
 */
export interface OpPairInput<Specs extends PolyhedronSpecs, L = {}, R = L> {
  /**
   * The graph defining which polyhedral formes map onto each other when applying the operation
   * or its inverse and under which options it does so.
   */
  graph(): GraphGenerator<Specs, L, R>
  /**
   * Defines the intermediate forme to interpolate to the left or right positions.
   * If "left" or "right" is given, then the intermediate forme is set to the forme of that side.
   * If instead a function is defined that returns Specs or a Forme, that forme (or the forme corresponding
   * to that Specs) is used.
   */
  intermediate: Side | IntermediateGetter<Specs, L, R>
  /**
   * Defines how to align the solid for the purposes of interpolating the intermediate forme into
   * the left and right formes.
   */
  getPose(
    solid: Forme<Specs>,
    opts: GraphOpts<L, R>,
    side: Side | "intermediate",
  ): Pose
  /**
   * Define how to interpolate the intermediate forme into the left forme.
   * If undefined, the intermediate is assumed to be identical to the left forme.
   */
  toLeft?: MorphDefinition<Forme<Specs>>
  /**
   * Define how to interpolate the intermediate forme into the right forme.
   * If undefined, the intermediate is assumed to be identical to the right forme.
   */
  toRight?: MorphDefinition<Forme<Specs>>
}

export interface MorphDefinition<F extends Forme> {
  intermediateFaces?(forme: F): Face[]
  sideFacets?(forme: F, intermediate: F): (Face | Vertex)[]
}

export type GraphGenerator<Specs, L, R> = Generator<GraphEntry<Specs, L, R>>

export interface GraphEntry<Specs, L, R> {
  left: Specs
  right: Specs
  options?: GraphOpts<L, R>
}

export interface GraphOpts<L, R> {
  left: L
  right: R
}

type Opts<S extends Side, L, R> = S extends "left" ? L : R

export type Side = "left" | "right"

type IntermediateGetter<S extends PolyhedronSpecs, L, R> = (
  entry: GraphEntry<S, L, R>,
) => S | Forme<S>

/**
 * Create an operation pair from the provided input parameters.
 */
export function makeOpPair<Specs extends PolyhedronSpecs, L = {}, R = L>(
  opInput: OpPairInput<Specs, L, R>,
) {
  const op = new OpPair(opInput)
  return { left: makeOperation("left", op), right: makeOperation("right", op) }
}

class OpPair<
  Specs extends PolyhedronSpecs,
  L extends {} = {},
  R extends {} = L
> {
  inputs: OpPairInput<Specs, L, R>
  graph: GraphEntry<Specs, L, R>[]

  constructor(inputs: OpPairInput<Specs, L, R>) {
    this.inputs = inputs
    this.graph = [...this.inputs.graph()]
  }

  // Return the graph entries for the given side that match the given Specs
  private getEntries(side: Side, specs: Specs) {
    return this.graph.filter((entry) => entry[side].equals(specs))
  }

  findEntry<S extends Side>(side: S, specs: Specs, opts?: Opts<S, L, R>) {
    return this.graph.find(
      (entry) =>
        entry[side].equals(specs) &&
        isMatch(entry.options?.[side] ?? {}, opts ?? {}),
    )
  }

  getEntry<S extends Side>(side: S, specs: Specs, opts?: Opts<S, L, R>) {
    const entry = this.findEntry(side, specs, opts)
    if (!entry)
      throw new Error(
        `Could not find ${side} entry with specs: ${specs.name()}, opts: ${JSON.stringify(
          opts,
        )}`,
      )
    return entry
  }

  hasOptions(side: Side, specs: Specs) {
    return this.getEntries(side, specs).length > 1
  }

  *allOptions<S extends Side>(side: S, specs: Specs): Generator<Opts<S, L, R>> {
    for (const entry of this.getEntries(side, specs)) {
      yield (entry.options?.[side] ?? {}) as Opts<S, L, R>
    }
  }

  canApplyTo(side: Side, specs: PolyhedronSpecs) {
    return !!this.findEntry(side, specs as Specs)
  }

  getOpposite<S extends Side>(side: S, specs: Specs, options?: Opts<S, L, R>) {
    return this.getEntry(side, specs, options)[oppositeSide(side)]
  }

  apply<S extends Side>(side: S, start: Forme<Specs>, opts: Opts<S, L, R>) {
    let {
      intermediate: getIntermediate,
      getPose,
      toLeft = {},
      toRight = {},
    } = this.inputs

    // Alternate strategy that keeps things consistent
    // maybe a possible option?
    // function getPose(forme: any, options: any, side: any) {
    //   return {
    //     ..._getPose(forme, options, side),
    //     scale: mean(forme.geom.edges.map((e: any) => e.distanceToCenter())),
    //     origin: forme.geom.centroid(),
    //   }
    // }

    const specs = start.specs as Specs
    const entry = this.getEntry(side, specs, opts)
    const options =
      entry.options ?? ({ left: {}, right: {} } as GraphOpts<L, R>)
    const startPose = getPose(start, options, side)

    // Get the aligned version of the end forme
    const endSpecs = entry[oppositeSide(side)]
    const endGeom = getGeometry(endSpecs)
    const unalignedEnd = createForme(endSpecs, endGeom)
    const end = unalignedEnd.align(
      getPose(unalignedEnd, options, oppositeSide(side)),
      startPose,
    ) as Forme<Specs>

    let intermediate: Forme<Specs>
    if (typeof getIntermediate === "string") {
      // If we receive either "left" or "right"
      // set the intermediate to the corresponding forme
      intermediate = getIntermediate === side ? start : end
    } else {
      // Otherwise, we have to fetch the intermediate solid ourselves
      const inter = getIntermediate(entry)
      // TODO figure out a way to get this without importing the base constructor?
      const middleSolid =
        inter instanceof BaseForme
          ? inter
          : createForme(inter, getGeometry(inter))

      intermediate = middleSolid.align(
        getPose(middleSolid, options, "intermediate"),
        startPose,
      ) as Forme<Specs>
    }

    const [startMorph, endMorph] =
      side === "left" ? [toLeft, toRight] : [toRight, toLeft]

    return {
      result: end,
      animationData: {
        start: intermediate.geom.withVertices(
          getMorphedVertices(intermediate, start, startMorph),
        ),
        endVertices: getMorphedVertices(intermediate, end, endMorph),
        // Get the appearances of the intermediate faces
        startAppearance: getMorphedAppearances(intermediate, start, startMorph),
        endAppearance: getMorphedAppearances(intermediate, end, endMorph),
      },
    }
  }
}

export type OpInput<O, S extends PolyhedronSpecs, GO = O> = Required<
  Pick<OpArgs<O, S, GO>, "apply" | "graph" | "toGraphOpts">
>

/**
 * Turn an operation pair into the one-way operation corresponding to the given side
 */
function makeOperation<S extends Side, Specs extends PolyhedronSpecs, L, R>(
  side: S,
  op: OpPair<Specs, L, R>,
): OpInput<Opts<S, L, R>, Specs> {
  return {
    apply(solid, opts) {
      return op.apply(side, solid, opts)
    },
    graph: toDirected(side, op.inputs.graph),
    toGraphOpts(forme, opts) {
      return opts
    },
  }
}

export function combineOps<O, GO extends {} = O>(
  opArgs: OpInput<O, PolyhedronSpecs, GO>[],
): OpInput<O, PolyhedronSpecs, GO> {
  interface CallbackArg {
    op: OpInput<O, PolyhedronSpecs, GO>
    forme: Forme<PolyhedronSpecs>
    graphOpts: GO
  }

  function doWithRightForme<R>(
    solid: Forme<PolyhedronSpecs>,
    opts: O,
    callback: (args: CallbackArg) => R,
  ) {
    for (const op of opArgs) {
      // Finagle with the arguments to get the correctly (un)wrapped
      // version of the forme
      for (const { start, options = {} } of op.graph()) {
        if (!start.equivalent(solid.specs)) {
          continue
        }
        const forme = createForme(start, solid.geom)
        const graphOpts = op.toGraphOpts(forme, opts)
        if (isMatch(options, pickBy(graphOpts))) {
          return callback({ op, forme, graphOpts })
        }
      }
    }
    throw new Error(
      `Could not find matching graph entry for ${
        solid.specs.type
      } ${solid.specs.name()}`,
    )
  }
  return {
    graph: function* () {
      for (const op of opArgs) {
        yield* op.graph()
      }
    },
    apply(solid, opts) {
      return doWithRightForme(solid, opts, ({ op, forme }) =>
        op.apply(forme, opts),
      )
    },
    toGraphOpts(solid, opts) {
      return doWithRightForme(solid, opts, ({ graphOpts }) => graphOpts)
    },
  }
}

// Convert the graph generator into a directed graph (either left-to-right or right-to-left)
export function toDirected<S extends Side, Specs, L, R>(
  side: S,
  graph: () => Generator<GraphEntry<Specs, L, R>>,
): () => Generator<DirectedGraphEntry<Specs, Opts<S, L, R>>> {
  return function* () {
    for (const entry of graph()) {
      yield {
        start: entry[side],
        end: entry[oppositeSide(side)],
        options: entry.options?.[side] as any,
      }
    }
  }
}

function oppositeSide(side: Side) {
  return side === "left" ? "right" : "left"
}

function getMorphedVertices<F extends Forme>(
  interm: F,
  side: F,
  {
    sideFacets = (f) => f.geom.faces,
    intermediateFaces = (f) => f.geom.faces,
  }: MorphDefinition<F>,
) {
  const facePairs = getFacetPairs(
    intermediateFaces(interm),
    sideFacets(side, interm),
  )
  const mapping: Vertex[] = []
  for (const [face, facet] of facePairs) {
    for (const [v1, v2] of getVertexPairs(face, facet)) {
      mapping[v1.index] = v2
    }
  }
  const res = interm.geom.vertices.map((v) => {
    return mapping[v.index]
  })
  return res
}

function getMorphedAppearances<F extends Forme>(
  interm: F,
  side: F,
  morph: MorphDefinition<F>,
) {
  const {
    sideFacets = (f) => f.geom.faces,
    intermediateFaces = (f) => f.geom.faces,
  } = morph
  const facePairs = getFacetPairs(
    intermediateFaces(interm),
    sideFacets(side, interm),
  )
  const faceMapping: (Face | Vertex)[] = []
  for (const [face, facet] of facePairs) {
    faceMapping[face.index] = facet
  }

  // TODO handle normalizing stuff
  const morphedGeom = interm.geom.withVertices(
    getMorphedVertices(interm, side, morph),
  )

  return morphedGeom.faces.map((f) => {
    const defaultValue = interm.faceAppearance(interm.geom.faces[f.index])
    const matchingFacet = faceMapping[f.index]
    // If this face isn't matched to anything, or is tapered into a vertex, it has no intrinsic appearance
    if (!matchingFacet || matchingFacet instanceof Vertex) {
      // If it doesn't map to anything in the mapping,
      // try to find a face that matches the face's normal *exactly*
      if (f.edges.filter((e) => e.isValid()).length < 3) return defaultValue
      const conormalFace = side.geom.faces.find((f2) =>
        vecEquals(f.normal(), f2.normal()),
      )
      if (conormalFace) {
        return getMatchedAppearance(side, f, conormalFace)
      }
      return defaultValue
    }
    return getMatchedAppearance(side, f, matchingFacet)
  })
}

// Map an appearance from the side to the intermediate face
function getMatchedAppearance(side: Forme, f: Face, matchingFacet: Face) {
  const appearance = side.faceAppearance(matchingFacet)
  if (appearance.type !== "capstone" || appearance.faceType !== "side") {
    return appearance
  }
  // If there are different vertex appearances, map them based on index
  const offset = getPartnerVertexIndex(f, matchingFacet)
  // special case for truncating pyramids
  if (f.numSides !== appearance.sideColors.length) {
    console.log(
      "got mismatched capstone sides:",
      f.numSides,
      appearance.sideColors.length,
    )
    const sideColors = f.vertices.map((v, i) => {
      return getCyclic(appearance.sideColors, Math.floor(i / 2) + offset)
    })
    console.log(sideColors)

    return {
      ...appearance,
      sideColors: f.vertices.map((v, i) => {
        return getCyclic(appearance.sideColors, Math.floor(i / 2) + offset)
      }),
    }
  }
  return {
    ...appearance,
    sideColors: f.vertices.map((v, i) => {
      return getCyclic(appearance.sideColors, i + offset)
    }),
  }
}

// Find the faces in the first set that map onto the second set
function getFacetPairs(start: Face[], end: (Face | Vertex)[]) {
  return end.map((facet) => {
    return [findFacePartner(facet, start), facet] as const
  })
}

// Find the partner facet
function findFacePartner(facet: Face | Vertex, candidates: Face[]) {
  return minBy(candidates, (face2) => {
    return facet.normal().angleTo(face2.normal())
  })!
}

function getVertexPairs(startFace: Face, endFacet: Face | Vertex) {
  if (endFacet instanceof Vertex) {
    return startFace.vertices.map((v) => [v, endFacet])
  }
  const partnerIndex = getPartnerVertexIndex(startFace, endFacet)
  return startFace.vertices.map((v, i) => {
    return [v, getCyclic(endFacet.vertices, i + partnerIndex)] as [
      Vertex,
      Vertex,
    ]
  })
}

function getPartnerVertexIndex(f1: Face, f2: Face) {
  const v0 = f1.vertices[0]
  // snub vertices aren't aligned, so get the closest one
  return minBy(range(0, f2.numSides), (i) => {
    const v = f2.vertices[i]
    return f1
      .centroid()
      .clone()
      .sub(v0.vec)
      .angleTo(f2.centroid().clone().sub(v.vec))
  })!
}
