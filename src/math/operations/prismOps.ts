import { sortBy } from "lodash-es"
import { Twist } from "types"
import { Cap, FaceLike, Edge, Polyhedron } from "math/polyhedra"
import { PrismaticType } from "data/specs/common"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import Capstone from "data/specs/Capstone"
import Prismatic from "data/specs/Prismatic"
import { Solid, Pose } from "./OperationPair"
import Operation from "./Operation"
import { TwistOpts, getTransformedVertices } from "./operationUtils"
import { withOrigin } from "math/geom"
import { getAdjustInformation } from "./prismUtils"
import { combineOps, makeOpPair } from "./adapters"

// Get antiprism height of a unit antiprism with n sides
export function antiprismHeight(n: number) {
  const sec = 1 / Math.cos(Math.PI / (2 * n))
  return Math.sqrt(1 - (sec * sec) / 4)
}

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
  specs: PolyhedronSpecs,
  geom: Polyhedron,
  scale: number,
  twist?: Twist,
) {
  const vertexSets = getAdjustInformation(specs, geom)
  const angle = (getTwistMult(twist) * Math.PI) / getNumSides(specs)

  return getTransformedVertices(vertexSets, (set) =>
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
  return getScaledPrismVertices(specs, geom, scale, twist)
}

function doTurn(specs: PolyhedronSpecs, geom: Polyhedron, twist?: Twist) {
  const scale = -geom.edgeLength() * (antiprismHeight(getNumSides(specs)) - 1)
  return getScaledPrismVertices(specs, geom, scale, twist)
}

const capTypeMap: Record<string, number> = { rotunda: 0, cupola: 1, pyramid: 2 }

interface PrismOpArgs {
  // The list of *right* args
  query(data: Capstone): boolean
  rightElongation?: "prism" | "antiprism"
  getOrientation(solid: Solid<Capstone>): [FaceLike, Edge]
}

function makePrismOp({
  query,
  rightElongation = "antiprism",
  getOrientation,
}: PrismOpArgs) {
  const twist = rightElongation === "prism" ? undefined : "left"
  return (leftElongation: "prism" | null) => {
    return makeOpPair({
      graph: Capstone.query
        .where((s) => query(s) && s.data.elongation === rightElongation)
        .map((item) => ({
          left: item.withData({ elongation: leftElongation }),
          right: item,
        })),
      getIntermediate: (entry) => entry.right,
      getPose(side, solid) {
        const [face, edge] = getOrientation(solid)
        return getPose(face, edge, solid.specs.data.elongation, twist)
      },
      toLeft({ geom, specs }) {
        const fn = leftElongation === "prism" ? doTurn : doShorten
        return fn(specs, geom, twist)
      },
      toRight: (solid) => solid.geom.vertices,
    })
  }
}

const turnPrismatic = makeOpPair({
  // Every unelongated capstone (except fastigium) can be elongated
  graph: Prismatic.query
    .where((s) => s.isPrism() && !s.isDigonal())
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

const _elongate = makePrismOp({
  query: (s) => !s.isDigonal(),
  rightElongation: "prism",
  getOrientation({ geom }) {
    const face = sortBy(
      Cap.getAll(geom),
      (cap) => capTypeMap[cap.type],
    )[0].boundary()
    const edge = face.edges.find((e) => e.face.numSides === 3)!
    return [face, edge]
  },
})(null)

const pyramidOps = makePrismOp({
  query: (s) => s.isPyramid() && s.isMono() && s.data.base > 3,
  getOrientation({ geom }) {
    const face = geom.largestFace()
    return [face, face.edges[0]]
  },
})
const gyroelongPyramid = pyramidOps(null)
const turnPyramid = pyramidOps("prism")

const cupolaOps = makePrismOp({
  query: (s) => !s.isPyramid() && s.isMono() && !s.isDigonal(),
  getOrientation({ geom }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const face = Cap.getAll(geom)[0].boundary()
    const edge = face.edges.find((e) => e.face.numSides === 3)!
    return [face, edge]
  },
})

const gyroelongCupola = cupolaOps(null)
const turnCupola = cupolaOps("prism")

const bipyramidOps = makePrismOp({
  query: (s) => s.isPyramid() && s.isBi() && s.data.base > 3,
  getOrientation({ geom }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const face = Cap.getAll(geom)[0].boundary()
    return [face, face.edges[0]]
  },
})

const gyroelongBipyramid = bipyramidOps(null)
const turnBipyramid = bipyramidOps("prism")

function makeBicupolaPrismOp(leftElongation: null | "prism") {
  return makeOpPair<Capstone, TwistOpts>({
    graph: Capstone.query
      .where(
        (s) =>
          !s.isPyramid() &&
          s.isBi() &&
          !s.isDigonal() &&
          s.data.elongation === leftElongation,
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

const gyroelongBicupola = makeBicupolaPrismOp(null)
const turnBicupola = makeBicupolaPrismOp("prism")

// Exported operations

export const elongate = new Operation("elongate", _elongate.left)

export const gyroelongate = new Operation<TwistOpts, Capstone>(
  "gyroelongate",
  combineOps(
    [
      gyroelongPyramid,
      gyroelongCupola,
      gyroelongBipyramid,
      gyroelongBicupola,
    ].map((op) => op.left),
  ),
)

export const shorten = new Operation<TwistOpts, Capstone>(
  "shorten",
  combineOps(
    [
      _elongate,
      gyroelongPyramid,
      gyroelongCupola,
      gyroelongBipyramid,
      gyroelongBicupola,
    ].map((op) => op.right),
  ),
)

export const turn = new Operation<TwistOpts, Prismatic | Capstone>(
  "turn",
  combineOps(
    [
      turnPrismatic as any,
      turnPyramid,
      turnCupola,
      turnBipyramid,
      turnBicupola,
    ].flatMap((op) => [op.left, op.right]),
  ),
)
