import { find } from "utils"
import { Capstone, Twist, twists, oppositeTwist } from "specs"
import { withOrigin, getCentroid } from "math/geom"
import CapstoneForme from "math/formes/CapstoneForme"
import { combineOps, makeOpPair } from "./operationPairs"
import { makeOperation } from "./Operation"
import { Pose, TwistOpts, getTransformedVertices } from "./operationUtils"

const { PI } = Math

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

function getCapstonePose(forme: CapstoneForme, twist?: Twist): Pose {
  const [top, bottom] = forme.baseBoundaries()
  const edge = forme.specs.isPrismatic()
    ? top.edges[0]
    : find(top.edges, (e) => e.face.numSides === 3)
  const n = top.numSides
  const angle =
    (forme.specs.isGyroelongated() ? 1 : 0) * getTwistMult(twist) * (PI / n / 2)
  return {
    origin: getCentroid([top.centroid(), bottom.centroid()]),
    scale: forme.geom.edgeLength(),
    orientation: [
      top.normal(),
      edge.v1.vec
        .clone()
        .sub(top.centroid())
        .applyAxisAngle(top.normal(), angle),
    ],
  }
}

function getScaledPrismVertices(
  forme: CapstoneForme,
  scale: number,
  twist?: Twist,
) {
  const vertexSets = forme.bases()
  const angle = (getTwistMult(twist) * PI) / forme.specs.baseSides()

  return getTransformedVertices(vertexSets, (set) => {
    const rotateM = set.rotateNormal(angle / 2)
    const translateM = set.translateNormal(scale / 2)
    return withOrigin(set.normalRay().origin, rotateM.premultiply(translateM))
  })
}

function doPrismTransform(
  forme: CapstoneForme,
  result: Capstone,
  twist?: Twist,
) {
  const resultForme = CapstoneForme.fromSpecs(result)
  const resultHeight =
    (resultForme.prismaticHeight() / resultForme.geom.edgeLength()) *
    forme.geom.edgeLength()
  const scale = resultHeight - forme.prismaticHeight()
  return getScaledPrismVertices(forme, scale, twist)
}

interface PrismOpArgs {
  // The list of *right* args
  query(data: Capstone): boolean
  rightElongation?: "prism" | "antiprism"
}

function makePrismOp({ query, rightElongation = "antiprism" }: PrismOpArgs) {
  const twist = rightElongation === "prism" ? undefined : "left"
  return (leftElongation: "prism" | "none") => {
    return makeOpPair<CapstoneForme>({
      graph: function* () {
        for (const item of Capstone.query.where(
          (s) =>
            query(s) &&
            !s.isPrismatic() &&
            s.data.elongation === rightElongation,
        )) {
          yield {
            left: item.withElongation(leftElongation),
            right: item,
          }
        }
      },
      middle: "right",
      getPose(side, forme) {
        return getCapstonePose(forme, twist)
      },
      toLeft(forme, $, result) {
        return doPrismTransform(forme, result, twist)
      },
    })
  }
}

const turnPrismatic = makeOpPair<CapstoneForme>({
  // Every unelongated capstone (except fastigium) can be elongated
  graph: function* () {
    for (const entry of Capstone.query.where(
      (s) => s.isPrism() && !s.isDigonal(),
    )) {
      yield {
        left: entry,
        right: entry.withElongation("antiprism"),
      }
    }
  },
  middle: "right",
  getPose(side, forme) {
    return getCapstonePose(forme, "left")
  },
  toLeft: (forme, $, result) => doPrismTransform(forme, result, "left"),
})

const _elongate = makePrismOp({
  query: (s) => !s.isDigonal(),
  rightElongation: "prism",
})("none")

const canGyroelongPrimary = (s: Capstone) => s.isPrimary() && !s.isTriangular()
const canGyroelongSecondary = (s: Capstone) => s.isSecondary() && !s.isDigonal()

const pyramidOps = makePrismOp({
  query: (s) => canGyroelongPrimary(s),
})
const gyroelongPyramid = pyramidOps("none")
const turnPyramid = pyramidOps("prism")

const cupolaOps = makePrismOp({
  query: (s) => canGyroelongSecondary(s) && s.isMono(),
})

const gyroelongCupola = cupolaOps("none")
const turnCupola = cupolaOps("prism")

function makeBicupolaPrismOp(leftElongation: "none" | "prism") {
  return makeOpPair<CapstoneForme, TwistOpts>({
    graph: function* () {
      for (const entry of Capstone.query.where(
        (s) =>
          canGyroelongSecondary(s) &&
          s.isBi() &&
          s.data.elongation === leftElongation,
      )) {
        for (const twist of twists) {
          yield {
            left: entry,
            // left twisting a gyro bicupola makes it be *left* twisted
            // but the opposite for ortho bicupolae
            right: entry.withElongation(
              "antiprism",
              entry.isGyro() ? twist : oppositeTwist(twist),
            ),
            // Left and right options are opposites of each other
            options: {
              left: { twist },
              right: { twist: oppositeTwist(twist) },
            },
          }
        }
      }
    },
    middle: "right",
    getPose(side, forme, { right: { twist } }) {
      return getCapstonePose(forme, twist)
    },
    toLeft: (forme, { right: { twist } }, result) => {
      return doPrismTransform(forme, result, twist)
    },
  })
}

const gyroelongBicupola = makeBicupolaPrismOp("none")
const turnBicupola = makeBicupolaPrismOp("prism")

// Exported operations

export const elongate = makeOperation("elongate", _elongate.left)

export const gyroelongate = makeOperation(
  "gyroelongate",
  combineOps(
    [gyroelongPyramid, gyroelongCupola, gyroelongBicupola].map((op) => op.left),
  ),
)

export const shorten = makeOperation(
  "shorten",
  combineOps(
    [_elongate, gyroelongPyramid, gyroelongCupola, gyroelongBicupola].map(
      (op) => op.right,
    ),
  ),
)

export const turn = makeOperation(
  "turn",
  combineOps<CapstoneForme, Partial<TwistOpts>>(
    [turnPrismatic, turnPyramid, turnCupola, turnBicupola].flatMap((op) => [
      op.left,
      op.right,
    ]),
  ),
)
