import { pickBy } from "lodash-es"

import Capstone, { gyrations, Gyration } from "data/specs/Capstone"
import Elementary from "data/specs/Elementary"
import { Polyhedron, Face, Edge } from "math/polyhedra"
import { Vec3D } from "math/geom"
import { repeat } from "utils"
import { makeOperation } from "../Operation"
import {
  oppositeFace,
  deduplicateVertices,
  alignPolyhedron,
  Pose,
  getGeometry,
} from "../operationUtils"
import {
  inc,
  dec,
  CutPasteSpecs,
  CutPasteOpArgs,
  combineOps,
} from "./cutPasteUtils"
import PolyhedronForme from "math/formes/PolyhedronForme"
import CompositeForme, {
  GyrateSolidForme,
  DiminishedSolidForme,
} from "math/formes/CompositeForme"
import CapstoneForme from "math/formes/CapstoneForme"

type AugmentType = "pyramid" | "cupola" | "rotunda"

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

type Query = (s: Capstone) => boolean
function getQuery(type: AugmentType): Query {
  switch (type) {
    case "pyramid":
      return (s) => s.isPrimary()
    case "cupola":
      return (s) => s.isCupola()
    case "rotunda":
      return (s) => s.isRotunda()
  }
}

function getAugmentee(type: AugmentType, base: number) {
  return getGeometry(
    Capstone.query.where(
      (s) =>
        s.isMono() &&
        s.isShortened() &&
        s.data.base === base &&
        getQuery(type)(s),
    )[0],
  )
}

type CrossAxis = (edge: Edge) => boolean

function defaultCrossAxis(edge: Edge) {
  return true
}

function getPose(base: Face, normal: Vec3D, crossAxis: CrossAxis): Pose {
  return {
    origin: base.centroid(),
    scale: base.sideLength(),
    orientation: [
      normal,
      base.edges.find(crossAxis)!.midpoint().sub(base.centroid()),
    ],
  }
}

function doAugment(
  info: CutPasteSpecs,
  polyhedron: Polyhedron,
  base: Face,
  baseCrossAxis: CrossAxis = defaultCrossAxis,
  augmenteeCrossAxis: CrossAxis = defaultCrossAxis,
  augmentType: AugmentType = defaultAugmentType(base.numSides),
) {
  const numSides = base.numSides
  const index = ["cupola", "rotunda"].includes(augmentType)
    ? numSides / 2
    : numSides
  const augmentee = getAugmentee(augmentType, index)
  const underside = augmentee.faceWithNumSides(base.numSides)

  const augmenteePose = getPose(
    underside,
    underside.normal().getInverted(),
    augmenteeCrossAxis,
  )

  const basePose = getPose(base, base.normal(), baseCrossAxis)

  const alignedAugmentee = alignPolyhedron(
    augmentee,
    augmenteePose,
    basePose,
  ).withoutFaces([underside])

  const augmenteeInitial = augmentee.withVertices(
    repeat(base.centroid(), augmentee.numVertices()),
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

const augmentCapstone: CutPasteOpArgs<Options, CapstoneForme> = {
  apply({ specs, geom }, { face, gyrate, using }) {
    const augmentType = using ?? defaultAugmentType(face.numSides)
    let baseAxis, augAxis
    // only matter if it's a bicupola that isn't gyroelongated
    // FIXME simplify this
    if (
      !specs.isPrismatic() &&
      specs.isSecondary() &&
      !specs.isGyroelongated()
    ) {
      baseAxis = (edge: Edge) => {
        if (specs.isShortened()) {
          return edge.twinFace().numSides === 3
        } else {
          return oppositeFace(edge).numSides === 3
        }
      }
      const hasRotunda = specs.data.rotundaCount! > 0
      const augmentRotunda = augmentType === "rotunda"
      const isCupolaRotunda = hasRotunda !== augmentRotunda
      if (gyrate === "ortho") {
        augAxis = (edge: Edge) =>
          isCupolaRotunda
            ? edge.twinFace().numSides !== 3
            : edge.twinFace().numSides === 3
      } else {
        augAxis = (edge: Edge) =>
          isCupolaRotunda
            ? edge.twinFace().numSides === 3
            : edge.twinFace().numSides !== 3
      }
    }
    return doAugment(specs, geom, face, baseAxis, augAxis, using)
  },

  canApplyTo(specs) {
    if (!specs.isCapstone()) return false
    return !specs.isBi()
  },

  getResult(forme, { using, gyrate }) {
    const { specs } = forme
    const base = specs.data.base
    return specs.withData({
      count: inc(specs.data.count) as any,
      rotundaCount: (specs.data.rotundaCount! +
        (using === "rotunda" ? 1 : 0)) as any,
      gyrate: base === 2 ? "gyro" : gyrate,
    })
  },
}

const augmentAugmentedSolids: CutPasteOpArgs<Options, CompositeForme> = {
  apply({ specs, geom }, { face }) {
    let baseAxis, augAxis
    const { source } = specs.data
    if (source.isClassical() && source.isTruncated()) {
      baseAxis = (edge: Edge) => edge.twinFace().numSides !== 3
      augAxis = (edge: Edge) => edge.twinFace().numSides === 3
    }
    return doAugment(specs, geom, face, baseAxis, augAxis)
  },

  canApplyTo(specs) {
    if (!specs.isComposite()) return false
    const { source, augmented } = specs.data
    if (source.isCapstone()) {
      return augmented < (source.data.base % 3 === 0 ? 3 : 2) && !specs.isPara()
    }
    return augmented < source.data.family - 2 && !specs.isPara()
  },

  getResult(forme, { face }) {
    return forme.specs.withData({
      augmented: inc(forme.specs.data.augmented),
      align: forme.alignment(face),
    })
  },
}

// FIXME deal with augmented octahedron and rhombicuboctahedron
const augmentIcosahedron: CutPasteOpArgs<Options, DiminishedSolidForme> = {
  apply({ specs, geom }, { face }) {
    return doAugment(specs, geom, face)
  },

  canApplyTo(specs) {
    if (!specs.isComposite()) return false
    const { source, diminished, augmented } = specs.data
    if (source.canonicalName() !== "icosahedron") return false
    return diminished > 0 && augmented === 0
  },

  getResult({ specs }, { face }) {
    const n = face.numSides
    if (n === 3) {
      return specs.withData({ augmented: 1 })
    }
    return specs.withData({
      diminished: dec(specs.data.diminished),
      align: "meta",
    })
  },
}

const augmentRhombicosidodecahedron: CutPasteOpArgs<
  Options,
  GyrateSolidForme
> = {
  apply({ specs, geom }, { face, gyrate }) {
    return doAugment(
      specs,
      geom,
      face,
      (edge) => edge.twinFace().numSides === 4,
      (edge) =>
        gyrate === "ortho"
          ? edge.twinFace().numSides === 4
          : edge.twinFace().numSides !== 4,
    )
  },

  canApplyTo(specs) {
    if (!specs.isComposite()) return false
    const { source, diminished } = specs.data
    if (source.canonicalName() !== "rhombicosidodecahedron") return false
    return diminished > 0
  },

  getResult({ specs }, { gyrate }) {
    const { diminished, gyrate: gyrated } = specs.data
    if (gyrate === "ortho") {
      return specs.withData({
        gyrate: inc(gyrated),
        diminished: dec(diminished),
      })
    } else {
      return specs.withData({ diminished: dec(diminished), align: "meta" })
    }
  },
}

const augmentElementary: CutPasteOpArgs<
  Options,
  PolyhedronForme<Elementary>
> = {
  apply({ specs, geom }, { face }) {
    return doAugment(specs, geom, face)
  },

  canApplyTo(specs) {
    return specs.canonicalName() === "sphenocorona"
  },

  getResult() {
    return Elementary.query.withName("augmented sphenocorona")
  },
}

export const augment = makeOperation("augment", {
  ...combineOps<Options, PolyhedronForme<CutPasteSpecs>>([
    augmentCapstone,
    augmentIcosahedron,
    augmentRhombicosidodecahedron,
    augmentAugmentedSolids,
    augmentElementary,
  ]),

  hasOptions() {
    return true
  },

  *allOptionCombos(forme) {
    const { specs, geom } = forme
    const gyrateOpts = hasGyrateOpts(specs) ? gyrations : [undefined]
    const usingOpts = getUsingOpts(specs) ?? [undefined]
    const faceOpts = geom.faces.filter((face) => canAugment(forme, face))

    for (const face of faceOpts) {
      for (const gyrate of gyrateOpts) {
        for (const using of usingOpts) {
          yield { gyrate, using, face }
        }
      }
    }
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

  allOptions(forme, optionName) {
    const { specs, geom } = forme
    switch (optionName) {
      case "gyrate":
        return hasGyrateOpts(specs) ? gyrations : []
      case "using":
        return getUsingOpts(specs) ?? []
      case "face":
        return geom.faces.filter((face) => canAugment(forme, face))
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
