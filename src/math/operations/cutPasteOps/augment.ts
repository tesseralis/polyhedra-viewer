import { pickBy } from "lodash-es"

import Prismatic from "data/specs/Prismatic"
import Capstone from "data/specs/Capstone"
import Composite from "data/specs/Composite"
import Elementary from "data/specs/Elementary"
import { Polyhedron, Face, Cap, Edge } from "math/polyhedra"
import { isInverse, PRECISION } from "math/geom"
import { repeat, getCyclic, getSingle } from "utils"
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

type AugmentSpecs = Prismatic | CutPasteSpecs

type AugmentType = "pyramid" | "cupola" | "rotunda"

function hasAugmentAlignment(info: AugmentSpecs) {
  if (!info.isComposite()) return false
  const { source, augmented } = info.data
  if (augmented !== 1) return false
  // Only hexagonal prism has augment alignment
  if (source.isPrismatic()) return source.data.base === 6
  // If Classical, has alignment if it has icosahedral symmetry
  return source.isIcosahedral()
}

function getAugmentAlignment(polyhedron: Polyhedron, face: Face) {
  const boundary = getSingle(Cap.getAll(polyhedron)).boundary()
  return isInverse(boundary.normal(), face.normal()) ? "para" : "meta"
}

function getPossibleAugmentees(n: number) {
  if (n <= 5) {
    return [getAugmentee("pyramid", n)]
  } else if (n < 10) {
    return [getAugmentee("cupola", n / 2)]
  } else {
    return [getAugmentee("cupola", n / 2), getAugmentee("rotunda", n / 2)]
  }
}

// Checks to see if the polyhedron can be augmented at the base while remaining convex
function canAugmentWith(base: Face, augmentee: Polyhedron, offset: number) {
  const n = base.numSides
  if (!augmentee) return false
  const underside = augmentee.faceWithNumSides(n)

  return base.edges.every((edge, i: number) => {
    const baseAngle = edge.dihedralAngle()

    const edge2 = getCyclic(underside.edges, i - 1 + offset)
    const augmenteeAngle = edge2.dihedralAngle()

    return baseAngle + augmenteeAngle < Math.PI - PRECISION
  })
}

function canAugmentWithType(base: Face, augmentType: AugmentType) {
  const n = augmentType === "pyramid" ? base.numSides : base.numSides / 2
  // FIXME maybe this should rely on Forme functions instead of dihedral angles
  if (![2, 3, 4, 5].includes(n)) return false
  if (augmentType === "rotunda" && n !== 5) return false
  for (const offset of [0, 1]) {
    if (canAugmentWith(base, getAugmentee(augmentType, n), offset)) {
      return true
    }
  }
  return false
}

function canAugment(base: Face) {
  const n = base.numSides
  const augmentees = getPossibleAugmentees(n)
  for (const augmentee of augmentees) {
    for (const offset of [0, 1]) {
      if (canAugmentWith(base, augmentee, offset)) {
        return true
      }
    }
  }
  return false
}

function getAugmentee(type: AugmentType, base: number) {
  // FIXME withData doesn't work because of the null value
  return getGeometry(
    Capstone.query.where(
      (s) =>
        s.isMono() &&
        s.isShortened() &&
        s.data.base === base &&
        s.data.type === type,
    )[0],
  )
}

function defaultCrossAxis(edge: Edge) {
  return true
}

// Augment the following
function doAugment(
  info: AugmentSpecs,
  polyhedron: Polyhedron,
  base: Face,
  augmentType: AugmentType,
  baseCrossAxis: (edge: Edge) => boolean = defaultCrossAxis,
  augmenteeCrossAxis: (edge: Edge) => boolean = defaultCrossAxis,
) {
  const numSides = base.numSides
  const index = ["cupola", "rotunda"].includes(augmentType)
    ? numSides / 2
    : numSides
  const augmentee = getAugmentee(augmentType, index)
  const underside = augmentee.faceWithNumSides(base.numSides)

  const augmenteePose: Pose = {
    origin: underside.centroid(),
    scale: augmentee.edgeLength(),
    orientation: [
      underside.normal().getInverted(),
      underside.edges
        .find(augmenteeCrossAxis)!
        .midpoint()
        .sub(underside.centroid()),
    ],
  }

  const basePose: Pose = {
    origin: base.centroid(),
    scale: base.sideLength(),
    orientation: [
      base.normal(),
      base.edges.find(baseCrossAxis)!.midpoint().sub(base.centroid()),
    ],
  }

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

function getUsingOpt(numSides: number, using?: AugmentType) {
  using = using ?? (numSides > 5 ? "cupola" : "pyramid")
  return { type: using, base: numSides > 5 ? numSides / 2 : numSides }
}

function hasRotunda(info: AugmentSpecs) {
  if (info.isPrismatic()) {
    return info.data.base === 10
  }
  if (info.isCapstone()) {
    return info.isMono() && !info.isPyramid() && info.isPentagonal()
  }
  return false
}

function getUsingOpts(info: AugmentSpecs): AugmentType[] | null {
  if (hasRotunda(info)) {
    return ["cupola", "rotunda"]
  }
  return null
}

function hasGyrateOpts(info: AugmentSpecs) {
  if (info.isCapstone()) {
    // Gyroelongated capstones are always gyro
    if (info.isGyroelongated()) return false
    // Cupolae and rotundae (that are not the gyrobifastigium) always have gyrate opts
    if (!info.isDigonal() && !info.isPyramid()) return true
    return false
  }
  if (info.isComposite()) {
    return info.data.source.canonicalName() === "rhombicosidodecahedron"
  }
  return false
}

type GyrateOpts = "ortho" | "gyro"
const allGyrateOpts: GyrateOpts[] = ["ortho", "gyro"]

interface Options {
  face: Face
  gyrate?: GyrateOpts
  using?: AugmentType
}

const augmentPrismatic: CutPasteOpArgs<
  Options,
  Prismatic,
  PolyhedronForme<Prismatic>
> = {
  apply({ specs, geom }, { face, using }) {
    const augmentType = using ?? defaultAugmentType(face.numSides)
    return doAugment(specs, geom, face, augmentType)
  },

  canApplyTo(specs) {
    if (!specs.isPrismatic()) return false
    const { base } = specs.data
    if (specs.isAntiprism() && base === 3) return false
    return base > 2
  },

  getResult({ specs }, { face, using }) {
    const n = face.numSides
    const { type, base } = getUsingOpt(n, using)
    return Capstone.query.withData({
      count: 1,
      elongation: specs.data.type,
      type,
      base: base as any,
    })
  },
}

const augmentCapstone: CutPasteOpArgs<
  Options,
  Capstone,
  PolyhedronForme<Capstone>
> = {
  apply({ specs, geom }, { face, gyrate, using }) {
    const augmentType = using ?? defaultAugmentType(face.numSides)
    let baseAxis, augAxis
    // only matter if it's a bicupola that isn't gyroelongated
    // FIXME simplify this
    if (!specs.isPyramid() && !specs.isGyroelongated()) {
      baseAxis = (edge: Edge) => {
        if (specs.isShortened()) {
          return edge.twinFace().numSides === 3
        } else {
          return oppositeFace(edge).numSides === 3
        }
      }
      const isCupolaRotunda = new Set([specs.data.type, augmentType]).size === 2
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
    return doAugment(specs, geom, face, augmentType, baseAxis, augAxis)
  },

  canApplyTo(specs) {
    if (!specs.isCapstone()) return false
    return specs.isMono()
  },

  getResult({ specs }, { face, using, gyrate }) {
    const n = face.numSides
    const { type, base } = getUsingOpt(n, using)
    return specs.withData({
      count: 2,
      gyrate: base === 2 ? "gyro" : gyrate,
      type: type === specs.data.type ? type : "cupolarotunda",
    })
  },
}

const augmentAugmentedSolids: CutPasteOpArgs<
  Options,
  Composite,
  PolyhedronForme<Composite>
> = {
  apply({ specs, geom }, { face }) {
    let baseAxis, augAxis
    const { source } = specs.data
    if (source.isClassical() && source.isTruncated()) {
      baseAxis = (edge: Edge) => edge.twinFace().numSides !== 3
      augAxis = (edge: Edge) => edge.twinFace().numSides === 3
    }
    const augmentType = defaultAugmentType(face.numSides)
    return doAugment(specs, geom, face, augmentType, baseAxis, augAxis)
  },

  canApplyTo(specs) {
    if (!specs.isComposite()) return false
    const { source, augmented } = specs.data
    if (source.isPrismatic()) {
      return augmented < (source.data.base % 3 === 0 ? 3 : 2) && !specs.isPara()
    }
    return augmented < source.data.family - 2 && !specs.isPara()
  },

  getResult({ specs, geom }, { face }) {
    return specs.withData({
      augmented: inc(specs.data.augmented),
      align: hasAugmentAlignment(specs)
        ? getAugmentAlignment(geom, face)
        : undefined,
    })
  },
}

// FIXME deal with augmented octahedron and rhombicuboctahedron
const augmentIcosahedron: CutPasteOpArgs<
  Options,
  Composite,
  PolyhedronForme<Composite>
> = {
  apply({ specs, geom }, { face }) {
    const augmentType = defaultAugmentType(face.numSides)
    return doAugment(specs, geom, face, augmentType)
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
  Composite,
  PolyhedronForme<Composite>
> = {
  apply({ specs, geom }, { face, gyrate }) {
    const augmentType = defaultAugmentType(face.numSides)
    return doAugment(
      specs,
      geom,
      face,
      augmentType,
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
  Elementary,
  PolyhedronForme<Elementary>
> = {
  apply({ specs, geom }, { face }) {
    const augmentType = defaultAugmentType(face.numSides)
    return doAugment(specs, geom, face, augmentType)
  },

  canApplyTo(specs) {
    return specs.canonicalName() === "sphenocorona"
  },

  getResult() {
    return Elementary.query.withName("augmented sphenocorona")
  },
}

export const augment = makeOperation<Options, CutPasteSpecs>("augment", {
  ...combineOps<Options, CutPasteSpecs, PolyhedronForme<CutPasteSpecs>>([
    augmentPrismatic,
    augmentCapstone,
    augmentIcosahedron,
    augmentRhombicosidodecahedron,
    augmentAugmentedSolids,
    augmentElementary,
  ]),

  hasOptions() {
    return true
  },

  *allOptionCombos({ specs, geom }) {
    const gyrateOpts = hasGyrateOpts(specs) ? allGyrateOpts : [undefined]

    const usingOpts = getUsingOpts(specs) ?? [undefined]
    const faceOpts = geom.faces.filter((face) => canAugment(face))

    for (const face of faceOpts) {
      for (const gyrate of gyrateOpts) {
        for (const using of usingOpts) {
          if (!using || canAugmentWithType(face, using)) {
            yield { gyrate, using, face }
          }
        }
      }
    }
  },

  hitOption: "face",
  getHitOption({ geom }, hitPnt, options) {
    if (!options) return {}
    const face = geom.hitFace(hitPnt)
    if (!options.using) {
      return canAugment(face) ? { face } : {}
    }
    if (!canAugmentWithType(face, options.using)) {
      return {}
    }
    return { face }
  },

  faceSelectionStates({ geom }, { face, using }) {
    return geom.faces.map((f) => {
      if (face && f.equals(face)) return "selected"

      if (!using && canAugment(f)) return "selectable"

      if (using && canAugmentWithType(f, using)) return "selectable"
      return undefined
    })
  },

  allOptions({ specs, geom }, optionName) {
    switch (optionName) {
      case "gyrate":
        return hasGyrateOpts(specs) ? allGyrateOpts : []
      case "using":
        return getUsingOpts(specs) ?? []
      case "face":
        return geom.faces.filter((face) => canAugment(face))
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
