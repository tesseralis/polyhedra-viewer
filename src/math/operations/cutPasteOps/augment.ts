import { mapValues, compact, every, xor, uniq, pickBy } from "lodash-es"

import Prismatic from "data/specs/Prismatic"
import Capstone from "data/specs/Capstone"
import Elementary from "data/specs/Elementary"
import { Polyhedron, Face, Cap } from "math/polyhedra"
import { isInverse, getOrthonormalTransform, PRECISION } from "math/geom"
import { repeat, getCyclic, getSingle } from "utils"
import { deduplicateVertices } from "../makeOperation"

import makeOperation from "../makeOperation"
import { withOrigin } from "../../geom"
import { inc, dec, CutPasteSpecs } from "./cutPasteUtils"

type AugmentSpecs = Prismatic | CutPasteSpecs

type AugmentType = "pyramid" | "cupola" | "rotunda"
const augmentees: Record<AugmentType, Record<number, string>> = {
  pyramid: {
    3: "tetrahedron",
    4: "square pyramid",
    5: "pentagonal pyramid",
  },

  cupola: {
    2: "triangular prism",
    3: "triangular cupola",
    4: "square cupola",
    5: "pentagonal cupola",
  },

  rotunda: {
    5: "pentagonal rotunda",
  },
}

const augmentData = mapValues(augmentees, (type) =>
  mapValues(type, Polyhedron.get),
)

const augmentTypes: Record<string, AugmentType> = {
  Y: "pyramid",
  U: "cupola",
  R: "rotunda",
}

function hasAugmentAlignment(info: AugmentSpecs) {
  if (!info.isComposite()) return false
  const { source, augmented } = info.data
  if (augmented !== 1) return false
  if (source.isPrismatic()) return source.data.base === 6
  return source.isIcosahedral()
}

function getAugmentAlignment(
  info: AugmentSpecs,
  polyhedron: Polyhedron,
  face: Face,
) {
  if (!hasAugmentAlignment(info)) return
  const boundary = getSingle(Cap.getAll(polyhedron)).boundary()
  return isInverse(boundary.normal(), face.normal()) ? "para" : "meta"
}

function getPossibleAugmentees(n: number) {
  const { pyramid, cupola, rotunda } = augmentData
  return compact([pyramid[n], cupola[n / 2], rotunda[n / 2]])
}

// Checks to see if the polyhedron can be augmented at the base while remaining convex
function canAugmentWith(base: Face, augmentee: Polyhedron, offset: number) {
  const n = base.numSides
  if (!augmentee) return false
  const underside = augmentee.faceWithNumSides(n)

  return every(base.edges, (edge, i: number) => {
    const baseAngle = edge.dihedralAngle()

    const edge2 = getCyclic(underside.edges, i - 1 + offset)
    const augmenteeAngle = edge2.dihedralAngle()

    return baseAngle + augmenteeAngle < Math.PI - PRECISION
  })
}

function canAugmentWithType(base: Face, augmentType: AugmentType) {
  const n = augmentType === "pyramid" ? base.numSides : base.numSides / 2
  for (const offset of [0, 1]) {
    if (canAugmentWith(base, augmentData[augmentType][n], offset)) {
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

// Computes the set equality of two arrays
const setEquals = <T>(array1: T[], array2: T[]) =>
  xor(array1, array2).length === 0

function getBaseType(base: Face) {
  const adjacentFaces = base.adjacentFaces()
  const adjacentFaceCounts = uniq(adjacentFaces.map((f) => f.numSides))
  if (setEquals(adjacentFaceCounts, [3, 4])) {
    return "cupola"
  } else if (setEquals(adjacentFaceCounts, [4])) {
    return "prism"
  } else if (setEquals(adjacentFaceCounts, [3])) {
    return "pyramidOrAntiprism"
  } else if (setEquals(adjacentFaceCounts, [3, 5])) {
    return "rotunda"
  } else if (setEquals(adjacentFaceCounts, [4, 5])) {
    return "rhombicosidodecahedron"
  } else {
    return "truncated"
  }
}

function getOppositePrismFace(base: Face) {
  return base.edges[0].twin().next().next().twinFace()
}

function isCupolaRotunda(baseType: string, augmentType: string) {
  return setEquals(["cupola", "rotunda"], [baseType, augmentType])
}

// TODO redo this function to rely on tableUtils instead
// Return true if the base and augmentee are aligned
function isAligned(
  polyhedron: Polyhedron,
  base: Face,
  underside: Face,
  gyrate: string | undefined,
  augmentType: string,
) {
  if (augmentType === "pyramid") return true
  const baseType = getBaseType(base)
  if (baseType === "pyramidOrAntiprism") {
    return true
  }

  if (baseType === "prism" && Cap.getAll(polyhedron).length === 0) {
    return true
  }

  if (baseType !== "truncated" && !gyrate) {
    throw new Error(`Must define 'gyrate' for augmenting ${baseType} `)
  }

  const adjFace =
    baseType === "prism" ? getOppositePrismFace(base) : base.adjacentFaces()[0]
  const alignedFace = getCyclic(underside.adjacentFaces(), -1)

  if (baseType === "rhombicosidodecahedron") {
    const isOrtho = (adjFace.numSides !== 4) === (alignedFace.numSides !== 4)
    return isOrtho === (gyrate === "ortho")
  }

  // It's orthogonal if triangle faces are aligned or non-triangle faces are aligned
  const isOrtho = (adjFace.numSides !== 3) === (alignedFace.numSides !== 3)

  if (baseType === "truncated") {
    return !isOrtho
  }

  // "ortho" or "gyro" is actually determined by whether the *tops* are aligned, not the bottoms
  // So for a cupola-rotunda, it's actually the opposite of everything else
  if (isCupolaRotunda(Cap.getAll(polyhedron)[0].type, augmentType)) {
    return isOrtho !== (gyrate === "ortho")
  }

  return isOrtho === (gyrate === "ortho")
}

function getAugmentee(augmentType: AugmentType, numSides: number) {
  const index = ["cupola", "rotunda"].includes(augmentType)
    ? numSides / 2
    : numSides
  return augmentData[augmentType][index]
}

function isFastigium(augmentType: string, numSides: number) {
  return augmentType === "cupola" && numSides === 4
}

// Augment the following
function doAugment(
  info: AugmentSpecs,
  polyhedron: Polyhedron,
  base: Face,
  augmentType: AugmentType,
  gyrate?: string,
) {
  const numSides = base.numSides
  const augmentee = getAugmentee(augmentType, numSides)
  const underside = augmentee.faceWithNumSides(base.numSides)

  // Determine the orientations of the underside and the base
  const undersideRadius = underside.vertices[0].vec
    .sub(underside.centroid())
    .getNormalized()

  const baseIsAligned = isAligned(
    polyhedron,
    base,
    underside,
    isFastigium(augmentType, numSides) ? "gyro" : gyrate,
    augmentType,
  )
  const offset = baseIsAligned ? 0 : 1
  const baseRadius = base.vertices[offset].vec
    .sub(base.centroid())
    .getNormalized()

  // https://math.stackexchange.com/questions/624348/finding-rotation-axis-and-angle-to-align-two-oriented-vectors
  // Determine the transformation that rotates the underside orientation to the base orientation
  // TODO we probably want this as some sort of generic method
  const transformMatrix = getOrthonormalTransform(
    undersideRadius,
    underside.normal().getInverted(),
    baseRadius,
    base.normal(),
  )
  const transform = withOrigin(base.centroid(), (u) =>
    transformMatrix.applyTo(u),
  )

  // Scale and position the augmentee so that it lines up with the base
  const alignedVertices = augmentee.vertices.map((v) => {
    return v.vec
      .sub(underside.centroid())
      .scale(base.sideLength() / augmentee.edgeLength())
      .add(base.centroid())
  })

  // Rotate the vertices so that they align with the base
  const rotatedVertices = alignedVertices.map((v) => transform(v))

  const newAugmentee = augmentee.withChanges((s) =>
    s.withVertices(rotatedVertices).withoutFaces([underside]),
  )

  const augmenteeInitial = augmentee.withVertices(
    repeat(base.centroid(), augmentee.numVertices()),
  )

  const endResult = polyhedron.addPolyhedron(newAugmentee)

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

const defaultAugmentees: Record<number, string> = {
  3: "Y3",
  4: "Y4",
  5: "Y5",
  6: "U3",
  8: "U4",
  10: "U5",
}

function getAugmenteeNumSides(using: string) {
  const prefix = using[0]
  const index = parseInt(using.substring(1))
  return "RU".includes(prefix) ? index * 2 : index
}

function getUsingOpt(using: string, numSides: number) {
  return typeof using === "string" && getAugmenteeNumSides(using) === numSides
    ? using
    : defaultAugmentees[numSides]
}

function hasRotunda(info: AugmentSpecs) {
  if (info.isPrismatic()) {
    return info.data.base === 10
  }
  if (info.isCapstone()) {
    return info.isMono() && !info.isPyramid() && info.data.base === 5
  }
  return false
}

function getGraphArgs(using: string) {
  const [prefix, baseStr] = using
  return { type: augmentTypes[prefix], base: parseInt(baseStr) }
}

function getUsingOpts(info: AugmentSpecs) {
  // Triangular prism or fastigium
  if (info.canonicalName() === "triangular prism") {
    return ["Y4", "U2"]
  }

  if (hasRotunda(info)) {
    return ["U5", "R5"]
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
  using?: string
}
export const augment = makeOperation<Options, AugmentSpecs>("augment", {
  apply(info, polyhedron, { face, gyrate, using }) {
    const augmentType = using
      ? augmentTypes[using[0]]
      : defaultAugmentType(face.numSides)
    return doAugment(info, polyhedron, face, augmentType, gyrate)
  },
  optionTypes: ["face", "gyrate", "using"],

  canApplyTo(info): info is AugmentSpecs {
    if (info.isPrismatic()) {
      const { base } = info.data
      if (info.isAntiprism() && base === 3) return false
      return base > 2
    }
    if (info.isCapstone()) {
      return info.isMono()
    }
    if (info.isComposite()) {
      const { source, diminished, augmented } = info.data
      if (source.canonicalName() === "rhombicosidodecahedron") {
        return diminished > 0
      }
      if (source.canonicalName() === "icosahedron") {
        return diminished > 0 && augmented === 0
      }
      if (source.isPrismatic()) {
        return augmented < (source.data.base % 3 === 0 ? 3 : 2)
      }
      if (source.isClassical()) {
        return augmented < source.data.family - 2
      }
    }
    if (info.isElementary()) {
      return info.canonicalName() === "sphenocorona"
    }
    return false
  },

  isPreferredSpec(info, { face, using }) {
    const n = face.numSides
    const { type, base } = getGraphArgs(getUsingOpt(using!, n))
    if (base === 4 && type === "pyramid") {
      if (info.isPrismatic() && info.isPrism()) return false
    }
    // for the fastigium, depend on what the using option is
    if (info.canonicalName() === "triangular prism") {
      if (type === "cupola") return info.isCapstone()
      return base === 3 ? info.isPrismatic() : info.isComposite()
    }
    return true
  },

  getResult(info, { face, using, gyrate }, polyhedron) {
    const n = face.numSides
    const { type, base } = getGraphArgs(getUsingOpt(using!, n))
    if (info.isPrismatic()) {
      return Capstone.query.withData({
        count: 1,
        elongation: info.data.type,
        type,
        base: base as any,
      })
    }
    if (info.isCapstone()) {
      return info.withData({
        count: 2,
        gyrate: base === 2 ? "gyro" : gyrate,
        type: type === info.data.type ? type : "cupolarotunda",
      })
    }
    if (info.isComposite()) {
      const { source, augmented, diminished, gyrate: gyrated } = info.data
      if (source.canonicalName() === "rhombicosidodecahedron") {
        if (gyrate === "ortho") {
          return info.withData({
            gyrate: inc(gyrated),
            diminished: dec(diminished),
          })
        } else {
          return info.withData({ diminished: dec(diminished), align: "meta" })
        }
      }
      if (source.canonicalName() === "icosahedron") {
        if (base === 3) {
          return info.withData({ augmented: 1 })
        }
        return info.withData({ diminished: dec(diminished), align: "meta" })
      }
      return info.withData({
        augmented: inc(augmented),
        align:
          augmented === 1
            ? getAugmentAlignment(info, polyhedron, face)
            : undefined,
      })
    }
    if (info.isElementary()) {
      return Elementary.query.withName("augmented sphenocorona")
    }
    throw new Error()
  },

  hasOptions() {
    return true
  },

  *allOptionCombos(info, polyhedron) {
    const gyrateOpts = hasGyrateOpts(info) ? allGyrateOpts : [undefined]

    const usingOpts = getUsingOpts(info) ?? [undefined]
    const faceOpts = polyhedron.faces.filter((face) => canAugment(face))

    for (const face of faceOpts) {
      for (const gyrate of gyrateOpts) {
        for (const using of usingOpts) {
          if (!using || canAugmentWithType(face, augmentTypes[using[0]])) {
            yield { gyrate, using, face }
          }
        }
      }
    }
  },

  hitOption: "face",
  getHitOption(polyhedron, hitPnt, options) {
    if (!options) return {}
    const face = polyhedron.hitFace(hitPnt)
    if (!options.using) {
      return canAugment(face) ? { face } : {}
    }
    if (!canAugmentWithType(face, augmentTypes[options.using[0]])) {
      return {}
    }
    return { face }
  },

  faceSelectionStates(polyhedron, { face, using }) {
    return polyhedron.faces.map((f) => {
      if (face && f.equals(face)) return "selected"

      if (!using && canAugment(f)) return "selectable"

      if (using && canAugmentWithType(f, augmentTypes[using[0]]))
        return "selectable"
      return undefined
    })
  },

  allOptions(info, polyhedron, optionName) {
    switch (optionName) {
      case "gyrate":
        return hasGyrateOpts(info) ? allGyrateOpts : []
      case "using":
        return getUsingOpts(info) ?? []
      case "face":
        return polyhedron.faces.filter((face) => canAugment(face))
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
