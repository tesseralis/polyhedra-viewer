import { sortBy } from "lodash-es"
import { Twist } from "types"
import { Cap, FaceLike, Edge } from "math/polyhedra"
import { PrismaticType } from "data/specs/common"
import Capstone from "data/specs/Capstone"
// import Prismatic from "data/specs/Prismatic"
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
  const angle = (elongation ? 1 : 0) * getTwistMult(twist) * (Math.PI / n / 2)

  return {
    origin,
    scale: length,
    orientation: [
      face.normal(),
      edge.v1.vec.sub(faceCenter).getRotatedAroundAxis(face.normal(), angle),
    ],
  }
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
  toLeft({ geom }) {
    // Shorten the solid
    // FIXME get the cap that we are aligned with and its opposite cap
    // push the caps inwards
    const adjustInfo = getAdjustInformation(geom)
    const scale = geom.edgeLength()

    return getScaledPrismVertices(adjustInfo, -scale)
  },
  toRight({ geom }) {
    // Elongated solids are already the intermediate
    return geom.vertices
  },
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
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    // const cap = sortBy(Cap.getAll(geom), (cap) => capTypeMap[cap.type])[0]
    const face = geom.largestFace()
    const edge = face.edges.find((e) => e.twinFace().numSides === 3)!
    return getPose(face, edge, specs.data.elongation, "left")
  },
  toLeft({ geom }) {
    // Shorten the solid
    // FIXME get the cap that we are aligned with and its opposite cap
    // push the caps inwards
    const adjustInfo = getAdjustInformation(geom)
    const n = adjustInfo.boundary.numSides
    const scale = geom.edgeLength() * antiprismHeight(n)

    return getScaledPrismVertices(adjustInfo, -scale, "left")
  },
  toRight({ geom }) {
    // Elongated solids are already the intermediate
    return geom.vertices
  },
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
  toLeft({ geom }) {
    // return geom.vertices
    // Shorten the solid
    // FIXME get the cap that we are aligned with and its opposite cap
    // push the caps inwards
    const adjustInfo = getAdjustInformation(geom)
    const n = adjustInfo.boundary.numSides
    const scale = geom.edgeLength() * antiprismHeight(n)

    return getScaledPrismVertices(adjustInfo, -scale, "left")
  },
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
  toLeft({ geom }) {
    // return geom.vertices
    // Shorten the solid
    // FIXME get the cap that we are aligned with and its opposite cap
    // push the caps inwards
    const adjustInfo = getAdjustInformation(geom)
    const n = adjustInfo.boundary.numSides
    const scale = geom.edgeLength() * antiprismHeight(n)

    return getScaledPrismVertices(adjustInfo, -scale, "left")
  },
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
  toLeft({ geom }, { right: { twist } }) {
    // Shorten the solid
    // push the caps inwards
    const adjustInfo = getAdjustInformation(geom)
    const n = adjustInfo.boundary.numSides
    const scale = geom.edgeLength() * antiprismHeight(n)

    return getScaledPrismVertices(adjustInfo, -scale, twist)
  },
  toRight: (solid) => solid.geom.vertices,
})
