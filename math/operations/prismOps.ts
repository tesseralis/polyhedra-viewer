import { find } from "lib/utils"
import { Capstone, Twist, twists, oppositeTwist } from "specs"
import { CapstoneForme } from "math/formes"
import { combineOps, makeOpPair } from "./operationPairs"
import { makeOperation } from "./Operation"
import { Pose, TwistOpts } from "./operationUtils"
import { getMorphFunction } from "./morph"
import { Face, Cap } from "math/polyhedra"

const morph = getMorphFunction(morphEndFaces)

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
  const [top] = forme.endBoundaries()
  const edge = forme.specs.isPrismatic()
    ? top.edges[0]
    : find(top.edges, (e) => e.face.numSides === 3)
  const n = top.numSides
  const angle =
    (forme.specs.isGyroelongated() ? 1 : 0) *
    getTwistMult(twist) *
    (Math.PI / n / 2)
  return {
    origin: forme.origin(),
    scale: forme.geom.edgeLength(),
    orientation: [top, top.to(edge).applyAxisAngle(top.normal(), angle)],
  }
}

interface PrismOpArgs {
  // The list of *right* args
  query(data: Capstone): boolean
  rightElongation?: "prism" | "antiprism"
}

function makePrismOp({ query, rightElongation = "antiprism" }: PrismOpArgs) {
  const twist = rightElongation === "prism" ? undefined : "left"
  return (leftElongation: "prism" | "none") => {
    return makeOpPair<Capstone>({
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
      getPose(forme) {
        return getCapstonePose(forme, twist)
      },
      toLeft: morph,
    })
  }
}

const turnPrismatic = makeOpPair<Capstone>({
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
  getPose(forme) {
    return getCapstonePose(forme, "left")
  },
  toLeft: morph,
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
  return makeOpPair<Capstone, TwistOpts>({
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
    getPose(forme, { right: { twist } }) {
      return getCapstonePose(forme, twist)
    },
    toLeft: morph,
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
  combineOps<Partial<TwistOpts>>(
    [turnPrismatic, turnPyramid, turnCupola, turnBicupola].flatMap((op) => [
      op.left,
      op.right,
    ]),
  ),
)

function morphEndFaces(forme: CapstoneForme) {
  // For most things, it suffices to just return all the faces
  if (forme.specs.isShortened()) {
    return forme.geom.faces
  }
  // However, for un-turning, we only want to morph the end faces
  return forme.ends().flatMap((end) => {
    return end instanceof Cap ? end.faces() : [end as Face]
  })
}
