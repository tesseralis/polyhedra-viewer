import { sortBy } from "lodash-es"
import { Twist } from "types"
import { Cap, FaceLike, Edge, Polyhedron } from "math/polyhedra"
import { PrismaticType } from "data/specs/common"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import Capstone from "data/specs/Capstone"
import Prismatic from "data/specs/Prismatic"
import OperationPair, { SolidArgs, Pose } from "./OperationPair"
import { getTransformedVertices } from "../operations/operationUtils"
import { withOrigin } from "math/geom"
import { getAdjustInformation, antiprismHeight } from "./prismUtils"
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

function getScaledPrismVertices(
  geom: Polyhedron,
  scale: number,
  twist?: Twist,
) {
  const { vertexSets, boundary } = getAdjustInformation(geom)
  const n = boundary.numSides
  const angle = (getTwistMult(twist) * Math.PI) / n

  return getTransformedVertices<FaceLike>(vertexSets, (set) =>
    withOrigin(set.normalRay(), (v) =>
      v
        .add(set.normal().scale(scale / 2))
        .getRotatedAroundAxis(set.normal(), angle / 2),
    ),
  )
}

/**
 * Shorten the given polyhedron with the optional twist
 */
function doShorten(specs: Capstone, geom: Polyhedron, twist?: Twist) {
  const scale =
    -geom.edgeLength() *
    getPrismaticHeight(getNumSides(specs), specs.data.elongation)
  return getScaledPrismVertices(geom, scale, twist)
}

function doTurn(specs: PolyhedronSpecs, geom: Polyhedron, twist?: Twist) {
  const scale = -geom.edgeLength() * (antiprismHeight(getNumSides(specs)) - 1)
  return getScaledPrismVertices(geom, scale, twist)
}

const capTypeMap: Record<string, number> = { rotunda: 0, cupola: 1, pyramid: 2 }

interface PrismOpArgs {
  // The list of *right* args
  query(data: Capstone["data"]): boolean
  rightElongation?: "prism" | "antiprism"
  getPose(solid: SolidArgs<Capstone>): Pose
}

function makePrismOp({
  query,
  rightElongation = "antiprism",
  getPose,
}: PrismOpArgs) {
  return (leftElongation: "prism" | null) => {
    return new OperationPair({
      graph: Capstone.query
        .where((data) => query(data) && data.elongation === rightElongation)
        .map((item) => ({
          left: item.withData({ elongation: leftElongation }),
          right: item,
        })),
      getIntermediate: (entry) => entry.right,
      getPose: (side, solid) => getPose(solid),
      toLeft({ geom, specs }) {
        const fn = leftElongation === "prism" ? doTurn : doShorten
        const twist = rightElongation === "prism" ? undefined : "left"
        return fn(specs, geom, twist)
      },
      toRight: (solid) => solid.geom.vertices,
    })
  }
}

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

export const elongate = makePrismOp({
  query: (data) => data.base > 2,
  rightElongation: "prism",
  getPose({ specs, geom }) {
    const cap = sortBy(Cap.getAll(geom), (cap) => capTypeMap[cap.type])[0]
    const face = cap.boundary()
    const edge = face.edges.find((e) => e.face.numSides === 3)!

    return getPose(face, edge, specs.data.elongation)
  },
})(null)

const pyramidOps = makePrismOp({
  query: (data) => data.type === "pyramid" && data.count === 1 && data.base > 3,
  getPose({ geom, specs }) {
    const face = geom.largestFace()
    return getPose(face, face.edges[0], specs.data.elongation, "left")
  },
})
export const gyroelongPyramid = pyramidOps(null)
export const turnPyramid = pyramidOps("prism")

const cupolaOps = makePrismOp({
  query: (data) => data.type !== "pyramid" && data.count === 1 && data.base > 2,
  getPose({ geom, specs }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const face = Cap.getAll(geom)[0].boundary()
    const edge = face.edges.find((e) => e.face.numSides === 3)!
    return getPose(face, edge, specs.data.elongation, "left")
  },
})

export const gyroelongCupola = cupolaOps(null)
export const turnCupola = cupolaOps("prism")

const bipyramidOps = makePrismOp({
  query: (data) => data.type === "pyramid" && data.count === 2 && data.base > 3,
  getPose({ geom, specs }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const face = Cap.getAll(geom)[0].boundary()
    const edge = face.edges[0]
    return getPose(face, edge, specs.data.elongation, "left")
  },
})

export const gyroelongBipyramid = bipyramidOps(null)
export const turnBipyramid = bipyramidOps("prism")

function makeBicupolaPrismOp(leftElongation: null | "prism") {
  return new OperationPair<Capstone, TwistOpts>({
    graph: Capstone.query
      .where(
        (data) =>
          data.type !== "pyramid" &&
          data.count === 2 &&
          data.base > 2 &&
          data.elongation === leftElongation,
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
    toLeft: ({ geom, specs }, { right: { twist } }) => {
      const fn = leftElongation === "prism" ? doTurn : doShorten
      return fn(specs, geom, twist)
    },
    toRight: (solid) => solid.geom.vertices,
  })
}

export const gyroelongBicupola = makeBicupolaPrismOp(null)
export const turnBicupola = makeBicupolaPrismOp("prism")
