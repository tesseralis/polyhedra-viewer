import { pickBy } from "lodash-es"

import Capstone, { gyrations, Gyration, CapType } from "data/specs/Capstone"
import Elementary from "data/specs/Elementary"
import { Polyhedron, Face, Edge, FaceLike } from "math/polyhedra"
import { repeat, find } from "utils"
import { makeOperation } from "../Operation"
import { deduplicateVertices, alignPolyhedron, Pose } from "../operationUtils"
import {
  CutPasteSpecs,
  augDimCapstoneGraph,
  augDimAugmentedSolidGraph,
  augDimDiminishedSolidGraph,
  augDimGyrateSolidGraph,
  augDimElementaryGraph,
  AugGraphOpts,
} from "./cutPasteUtils"
import { OpInput, combineOps, toDirected } from "../operationPairs"
import PolyhedronForme from "math/formes/PolyhedronForme"
import CompositeForme, {
  GyrateSolidForme,
  DiminishedSolidForme,
} from "math/formes/CompositeForme"
import CapstoneForme from "math/formes/CapstoneForme"

type AugmentType = Exclude<CapType, "cupolarotunda">

function canAugment(forme: PolyhedronForme, face: Face) {
  if (forme instanceof CapstoneForme) {
    return forme.baseFaces().some((base) => base.equals(face))
  } else if (forme instanceof CompositeForme) {
    return forme.canAugment(face)
  } else {
    // Elementary solid
    return face.numSides === 4
  }
}

function getAugmentee(type: AugmentType, base: number) {
  return CapstoneForme.fromSpecs(
    Capstone.query.where(
      (s) =>
        s.isMono() &&
        s.isShortened() &&
        s.data.base === base &&
        type === s.capType(),
    )[0],
  )
}

type CrossAxis = (edge: Edge) => boolean

// TODO make this a function on the cap forme
function capOrientation(type: AugmentType): CrossAxis {
  switch (type) {
    case "pyramid":
      return () => true
    case "cupola":
      return (e) => e.face.numSides === 4
    case "rotunda":
      return (e) => e.face.numSides === 3
  }
}

function defaultCrossAxis(edge: Edge) {
  return true
}

function getPose(base: FaceLike, crossAxis: CrossAxis): Pose {
  return {
    origin: base.centroid(),
    scale: base.sideLength(),
    orientation: [
      base.normal(),
      find(base.edges, crossAxis).midpoint().sub(base.centroid()),
    ],
  }
}

function doAugment(
  polyhedron: Polyhedron,
  base: Face,
  baseCrossAxis: CrossAxis = defaultCrossAxis,
  augmentType: AugmentType = defaultAugmentType(base.numSides),
) {
  const numSides = base.numSides
  const index = ["cupola", "rotunda"].includes(augmentType)
    ? numSides / 2
    : numSides

  const augmentee = getAugmentee(augmentType, index)
  const [top, bottom] = augmentee.baseBoundaries()

  const augmenteePose = getPose(top, capOrientation(augmentType))
  const basePose = getPose(base, baseCrossAxis)

  const alignedAugmentee = alignPolyhedron(
    augmentee.geom,
    augmenteePose,
    basePose,
  ).withoutFaces([bottom as Face])

  const augmenteeInitial = augmentee.geom.withVertices(
    repeat(base.centroid(), augmentee.geom.numVertices()),
  )

  const endResult = polyhedron.addPolyhedron(alignedAugmentee)

  return {
    animationData: {
      start: polyhedron.addPolyhedron(augmenteeInitial),
      endVertices: endResult.vertices,
    },
    result: deduplicateVertices(endResult.withoutFaces([base])),
  }
}

function defaultAugmentType(numSides: number) {
  return numSides <= 5 ? "pyramid" : "cupola"
}

function hasRotunda(info: CutPasteSpecs) {
  if (info.isCapstone()) {
    return info.isMono() && info.isSecondary() && info.isPentagonal()
  }
  return false
}

function getUsingOpts(info: CutPasteSpecs): AugmentType[] | null {
  if (hasRotunda(info)) {
    return ["cupola", "rotunda"]
  }
  return null
}

function hasGyrateOpts(info: CutPasteSpecs) {
  if (info.isCapstone()) {
    if (!info.isMono()) return false
    // Gyroelongated capstones are always gyro
    if (info.isGyroelongated()) return false
    // Cupolae and rotundae (that are not the gyrobifastigium) always have gyrate opts
    if (!info.isDigonal() && info.isSecondary()) return true
    return false
  }
  if (info.isComposite()) {
    return info.isGyrateSolid()
  }
  return false
}

interface Options {
  face: Face
  gyrate?: Gyration
  using?: AugmentType
}

type AugOpArgs<F extends PolyhedronForme> = OpInput<Options, F, AugGraphOpts>

const augmentCapstone: AugOpArgs<CapstoneForme> = {
  graph: toDirected("left", augDimCapstoneGraph),
  toGraphOpts(forme, { face, ...opts }) {
    return opts
  },
  apply(forme, { face, gyrate, using }) {
    const { specs, geom } = forme
    const augmentType = using ?? defaultAugmentType(face.numSides)
    let baseAxis
    // only matter if it's a bicupola that isn't gyroelongated
    if (
      !specs.isPrismatic() &&
      specs.isSecondary() &&
      !specs.isGyroelongated()
    ) {
      baseAxis = (edge: Edge) => {
        const orientationFn = capOrientation(
          forme.baseCaps()[0].type as AugmentType,
        )
        edge = edge.twin()
        if (!specs.isShortened()) edge = edge.next().next().twin()
        return gyrate === "ortho" ? orientationFn(edge) : !orientationFn(edge)
      }
    }
    return doAugment(geom, face, baseAxis, augmentType)
  },
}

const augmentAugmentedSolids: AugOpArgs<CompositeForme> = {
  graph: toDirected("left", augDimAugmentedSolidGraph),
  toGraphOpts(forme, { face }) {
    return { align: forme.alignment(face) }
  },
  apply({ specs, geom }, { face }) {
    let baseAxis
    const { source } = specs.data
    if (source.isClassical() && source.isTruncated()) {
      baseAxis = (edge: Edge) => edge.twinFace().numSides === 3
    }
    return doAugment(geom, face, baseAxis)
  },
}

// FIXME deal with augmented octahedron and rhombicuboctahedron
const augmentDiminishedSolids: AugOpArgs<DiminishedSolidForme> = {
  graph: toDirected("left", augDimDiminishedSolidGraph),
  toGraphOpts(forme, { face }) {
    return { faceType: face.numSides }
  },
  apply({ geom }, { face }) {
    return doAugment(geom, face)
  },
}

const augmentGyrateSolids: AugOpArgs<GyrateSolidForme> = {
  graph: toDirected("left", augDimGyrateSolidGraph),
  toGraphOpts(forme, { face, ...opts }) {
    return { gyrate: opts.gyrate }
  },
  apply({ geom }, { face, gyrate }) {
    const crossAxis: CrossAxis = (edge) =>
      edge.twinFace().numSides === (gyrate === "ortho" ? 4 : 5)
    return doAugment(geom, face, crossAxis)
  },
}

const augmentElementary: AugOpArgs<PolyhedronForme<Elementary>> = {
  graph: toDirected("left", augDimElementaryGraph),
  toGraphOpts() {
    return {}
  },
  apply({ geom }, { face }) {
    return doAugment(geom, face)
  },
}

export const augment = makeOperation("augment", {
  ...combineOps<PolyhedronForme<CutPasteSpecs>, Options, AugGraphOpts>([
    augmentCapstone,
    augmentDiminishedSolids,
    augmentGyrateSolids,
    augmentAugmentedSolids,
    augmentElementary,
  ]),

  hasOptions() {
    return true
  },

  hitOption: "face",
  getHitOption(forme, hitPnt, options) {
    if (!options) return {}
    const face = forme.geom.hitFace(hitPnt)
    return canAugment(forme, face) ? { face } : {}
  },

  faceSelectionStates(forme, { face }) {
    return forme.geom.faces.map((f) => {
      if (face && f.equals(face)) return "selected"
      if (canAugment(forme, f)) return "selectable"
      return undefined
    })
  },

  allOptions(forme) {
    const { specs, geom } = forme
    return {
      gyrate: hasGyrateOpts(specs) ? gyrations : [undefined],
      using: getUsingOpts(specs) ?? [undefined],
      face: geom.faces.filter((face) => canAugment(forme, face)),
    }
  },

  defaultOptions(info) {
    const usingOpts = getUsingOpts(info) ?? []
    return pickBy({
      gyrate: hasGyrateOpts(info) && "gyro",
      using: usingOpts.length > 1 && usingOpts[0],
    })
  },
})
