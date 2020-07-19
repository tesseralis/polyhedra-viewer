import { sortBy } from "lodash-es"
import { Twist } from "types"
import { Cap, FaceLike, Edge, Polyhedron } from "math/polyhedra"
import { PrismaticType } from "data/specs/common"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import Capstone from "data/specs/Capstone"
import Prismatic from "data/specs/Prismatic"
import OperationPair, { Pose } from "./OperationPair"
import {
  getAdjustInformation,
  getScaledPrismVertices,
  antiprismHeight,
} from "../operations/prismOps/prismUtils"
import { TwistOpts } from "./opPairUtils"

function getPrismaticHeight(n: number, elongation: PrismaticType | null) {
  switch (elongation) {
    case "prism":
      return 1
    case "antiprism":
      return antiprismHeight(n)
    default:
      return 0
  }
}

function getTwistMult(twist?: Twist) {
  switch (twist) {
    case "left":
      return 1
    case "right":
      return -1
    default:
      return 0
  }
}

function getPose(
  face: FaceLike,
  edge: Edge,
  elongation: PrismaticType | null,
  twist?: Twist,
): Pose {
  const faceCenter = face.centroid()
  const length = face.sideLength()
  const n = face.numSides
  const origin = faceCenter.sub(
    face.normal().scale((length * getPrismaticHeight(n, elongation)) / 2),
  )
  const angle =
    (elongation === "antiprism" ? 1 : 0) *
    getTwistMult(twist) *
    (Math.PI / n / 2)

  return {
    origin,
    scale: length,
    orientation: [
      face.normal(),
      edge.v1.vec.sub(faceCenter).getRotatedAroundAxis(face.normal(), angle),
    ],
  }
}

function getNumSides(specs: PolyhedronSpecs) {
  if (specs.isPrismatic()) {
    return specs.data.base
  } else if (specs.isCapstone()) {
    if (specs.isPyramid()) return specs.data.base
    return 2 * specs.data.base
  }
  throw new Error(`Invalid specs: ${specs.name()}`)
}

/**
 * Shorten the given polyhedron with the optional twist
 */
function doShorten(specs: Capstone, geom: Polyhedron, twist?: Twist) {
  const adjustInformation = getAdjustInformation(geom)
  const scale =
    -geom.edgeLength() *
    getPrismaticHeight(getNumSides(specs), specs.data.elongation)
  return getScaledPrismVertices(adjustInformation, scale, twist)
}

function doTurn(specs: PolyhedronSpecs, geom: Polyhedron, twist?: Twist) {
  const adjustInformation = getAdjustInformation(geom)
  const scale = -geom.edgeLength() * (antiprismHeight(getNumSides(specs)) - 1)
  return getScaledPrismVertices(adjustInformation, scale, twist)
}

const capTypeMap: Record<string, number> = { rotunda: 0, cupola: 1, pyramid: 2 }

export const elongate = new OperationPair<Capstone>({
  // Every unelongated capstone (except fastigium) can be elongated
  graph: Capstone.query
    .where((data) => !data.elongation && data.base > 2)
    .map((entry) => {
      return {
        left: entry,
        right: entry.withData({ elongation: "prism" }),
      }
    }),
  getIntermediate: (entry) => entry.right,
  getPose(side, { specs, geom }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    // FIXME this is annoying lol
    const cap = sortBy(Cap.getAll(geom), (cap) => capTypeMap[cap.type])[0]
    const face = cap.boundary()
    const edge = face.edges.find((e) => e.face.numSides === 3)!

    return getPose(face, edge, specs.data.elongation)
  },
  toLeft: ({ geom, specs }) => doShorten(specs, geom),
  toRight: ({ geom }) => geom.vertices,
})

export const gyroelongPyramid = new OperationPair<Capstone>({
  // Every unelongated capstone (except fastigium) can be elongated
  graph: Capstone.query
    .where(
      (data) =>
        data.type === "pyramid" &&
        data.count === 1 &&
        !data.elongation &&
        data.base > 3,
    )
    .map((entry) => ({
      left: entry,
      right: entry.withData({ elongation: "antiprism" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { geom, specs }) {
    const face = geom.largestFace()
    return getPose(face, face.edges[0], specs.data.elongation, "left")
  },
  toLeft: ({ geom, specs }) => doShorten(specs, geom, "left"),
  toRight: ({ geom }) => geom.vertices,
})

export const gyroelongCupola = new OperationPair<Capstone>({
  graph: Capstone.query
    .where(
      (data) =>
        data.type !== "pyramid" &&
        data.count === 1 &&
        data.base > 2 &&
        !data.elongation,
    )
    .map((entry) => ({
      left: entry,
      right: entry.withData({ elongation: "antiprism" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { geom, specs }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const capBoundary = Cap.getAll(geom)[0].boundary()
    const edge = capBoundary.edges.find((e) => e.face.numSides === 3)!
    return getPose(capBoundary, edge, specs.data.elongation, "left")
  },
  toLeft: ({ geom, specs }) => doShorten(specs, geom, "left"),
  toRight: (solid) => solid.geom.vertices,
})

export const gyroelongBipyramid = new OperationPair<Capstone>({
  graph: Capstone.query
    .where(
      (data) =>
        data.type === "pyramid" &&
        data.count === 2 &&
        data.base > 3 &&
        !data.elongation,
    )
    .map((entry) => ({
      left: entry,
      right: entry.withData({ elongation: "antiprism" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { specs, geom }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const face = Cap.getAll(geom)[0].boundary()
    const edge = face.edges.find((e) => e.face.numSides === 3)!
    return getPose(face, edge, specs.data.elongation, "left")
  },
  toLeft: ({ geom, specs }) => doShorten(specs, geom, "left"),
  toRight: (solid) => solid.geom.vertices,
})

export const gyroelongBicupola = new OperationPair<Capstone, TwistOpts>({
  graph: Capstone.query
    .where(
      (data) =>
        data.type !== "pyramid" &&
        data.count === 2 &&
        data.base > 2 &&
        !data.elongation,
    )
    .flatMap((entry) => {
      // FIXME lol this is ugly
      const [twist1, twist2]: [Twist, Twist] =
        entry.data.gyrate === "gyro" ? ["left", "right"] : ["right", "left"]
      return [
        {
          left: entry,
          right: entry.withData({ elongation: "antiprism", twist: twist1 }),
          options: { left: { twist: "left" }, right: { twist: "right" } },
        },
        {
          left: entry,
          right: entry.withData({ elongation: "antiprism", twist: twist2 }),
          options: { left: { twist: "right" }, right: { twist: "left" } },
        },
      ]
    }),
  getIntermediate: (entry) => entry.right,
  getPose(side, { specs, geom }, { right: { twist } }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const caps = Cap.getAll(geom)
    const cap = specs.isCupolaRotunda()
      ? caps.find((cap) => cap.type === "rotunda")!
      : caps[0]
    const face = cap.boundary()
    const edge = face.edges.find((e) => e.face.numSides === 3)!
    return getPose(face, edge, specs.data.elongation, twist)
  },
  toLeft: ({ geom, specs }, { right: { twist } }) =>
    doShorten(specs, geom, twist),
  toRight: (solid) => solid.geom.vertices,
})

export const turnPrismatic = new OperationPair<Prismatic>({
  // Every unelongated capstone (except fastigium) can be elongated
  graph: Prismatic.query
    .where((data) => data.type === "prism" && data.base > 2)
    .map((entry) => ({
      left: entry,
      right: entry.withData({ type: "antiprism" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { geom, specs }) {
    const face = geom.faceWithNumSides(specs.data.base)
    return getPose(face, face.edges[0], specs.data.type, "left")
  },
  toLeft: ({ geom, specs }) => doTurn(specs, geom, "left"),
  toRight: ({ geom }) => geom.vertices,
})

export const turnPyramid = new OperationPair<Capstone>({
  // Every unelongated capstone (except fastigium) can be elongated
  graph: Capstone.query
    .where(
      (data) =>
        data.type === "pyramid" &&
        data.count === 1 &&
        data.elongation === "prism" &&
        data.base > 3,
    )
    .map((entry) => ({
      left: entry,
      right: entry.withData({ elongation: "antiprism" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { geom, specs }) {
    const nbrFace = side === "left" ? 4 : 3
    const face = geom.faces.find(
      (face) =>
        face.numSides === specs.data.base &&
        // Make sure we don't get the wrong cube face
        face.adjacentFaces().every((f) => f.numSides === nbrFace),
    )!
    return getPose(face, face.edges[0], specs.data.elongation, "left")
  },
  toLeft: ({ geom, specs }) => doTurn(specs, geom, "left"),
  toRight: ({ geom }) => geom.vertices,
})

export const turnCupola = new OperationPair<Capstone>({
  graph: Capstone.query
    .where(
      (data) =>
        data.type !== "pyramid" &&
        data.count === 1 &&
        data.base > 2 &&
        data.elongation === "prism",
    )
    .map((entry) => ({
      left: entry,
      right: entry.withData({ elongation: "antiprism" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { geom, specs }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const capBoundary = Cap.getAll(geom)[0].boundary()
    const edge = capBoundary.edges.find((e) => e.face.numSides === 3)!
    return getPose(capBoundary, edge, specs.data.elongation, "left")
  },
  toLeft: ({ geom, specs }) => doTurn(specs, geom, "left"),
  toRight: (solid) => solid.geom.vertices,
})

export const turnBipyramid = new OperationPair<Capstone>({
  graph: Capstone.query
    .where(
      (data) =>
        data.type === "pyramid" &&
        data.count === 2 &&
        data.base > 3 &&
        data.elongation === "prism",
    )
    .map((entry) => ({
      left: entry,
      right: entry.withData({ elongation: "antiprism" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { specs, geom }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const face = Cap.getAll(geom)[0].boundary()
    const edge = face.edges.find((e) => e.face.numSides === 3)!
    return getPose(face, edge, specs.data.elongation, "left")
  },
  toLeft: ({ geom, specs }) => doTurn(specs, geom, "left"),
  toRight: (solid) => solid.geom.vertices,
})

export const turnBicupola = new OperationPair<Capstone, TwistOpts>({
  graph: Capstone.query
    .where(
      (data) =>
        data.type !== "pyramid" &&
        data.count === 2 &&
        data.base > 2 &&
        data.elongation === "prism",
    )
    .flatMap((entry) => {
      // FIXME lol this is ugly
      const [twist1, twist2]: [Twist, Twist] =
        entry.data.gyrate === "gyro" ? ["left", "right"] : ["right", "left"]
      return [
        {
          left: entry,
          right: entry.withData({ elongation: "antiprism", twist: twist1 }),
          options: { left: { twist: "left" }, right: { twist: "right" } },
        },
        {
          left: entry,
          right: entry.withData({ elongation: "antiprism", twist: twist2 }),
          options: { left: { twist: "right" }, right: { twist: "left" } },
        },
      ]
    }),
  getIntermediate: (entry) => entry.right,
  getPose(side, { specs, geom }, { right: { twist } }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const caps = Cap.getAll(geom)
    const cap = specs.isCupolaRotunda()
      ? caps.find((cap) => cap.type === "rotunda")!
      : caps[0]
    const face = cap.boundary()
    const edge = face.edges.find((e) => e.face.numSides === 3)!
    return getPose(face, edge, specs.data.elongation, twist)
  },
  toLeft: ({ geom, specs }, { right: { twist } }) => doTurn(specs, geom, twist),
  toRight: (solid) => solid.geom.vertices,
})
