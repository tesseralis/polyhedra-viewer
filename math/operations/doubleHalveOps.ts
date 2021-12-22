import { find } from "lib/utils"
import { Twist } from "specs"
import { Pose } from "./operationUtils"
import { Capstone, Composite, twists } from "specs"
import { makeOpPair, combineOps } from "./operationPairs"
import { makeOperation } from "./Operation"
import { CapstoneForme } from "math/formes"
import { Edge, Face } from "math/polyhedra"
import { TwistOpts } from "./operationUtils"
import { getMorphFunction } from "./morph"
import { AugmentedPrismForme } from "math/formes/CompositeForme"

const doubleHalve = makeOpPair<Capstone, TwistOpts>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (s) => s.isPrimary() && !s.isSnub(),
    )) {
      if (entry.isGyroelongated()) {
        if (entry.isDigonal()) {
          yield {
            left: entry,
            right: entry.withData({ base: 4 }),
          }
          continue
        }
        if (!entry.isBi()) {
          yield {
            left: entry,
            right: entry.withData({ type: "secondary" }),
          }
        } else {
          for (const twist of twists) {
            yield {
              left: entry,
              right: entry.withData({ type: "secondary", twist }),
              options: { left: { twist } } as any,
            }
          }
        }
      } else {
        yield {
          left: entry,
          right: entry.withData({ type: "secondary", gyrate: "ortho" }),
        }
      }
    }
  },
  middle: "right",
  getPose(forme, { left: { twist } }) {
    return getCapstonePose(forme, twist)
  },
  toLeft: getMorphFunction(endMorphFaces, startMorphFaces),
})

const doubleHalveComposite = makeOpPair<Composite>({
  graph: function* () {
    // TODO will this catch the wrapped source?
    for (const entry of Composite.query.where(
      (e) =>
        e.data.source.isCapstone() &&
        e.data.source.isTriangular() &&
        e.data.source.isPrimary(),
    )) {
      yield {
        left: entry,
        // Augmented triangular prism -> augmented hexagonal prism
        right: entry.withData({
          source: entry.sourcePrism().withData({ type: "secondary" }),
          align: "meta",
        }),
      }
    }
  },
  middle: "right",
  getPose(forme) {
    return {
      origin: forme.sourceCentroid(),
      scale: forme.geom.edgeLength(),
      orientation: forme.orientation(),
    }
  },
  toLeft: getMorphFunction(compositeEndMorphFaces),
})

export const double = makeOperation(
  "double",
  combineOps([doubleHalve.left, doubleHalveComposite.left]),
)
export const halve = makeOperation(
  "halve",
  combineOps([doubleHalve.right, doubleHalveComposite.right]),
)

function endMorphFaces(forme: CapstoneForme) {
  if (forme.specs.isBi()) {
    return forme.geom.faces
  }
  if (forme.specs.isMono()) {
    // For mono-capstones, include the top cap
    const cap = forme.caps()[0]
    let faces = cap.faces()
    // If (gyro-)elongated, add the side faces as well.
    if (!forme.specs.isShortened()) {
      faces = faces.concat(forme.sideFaces())
    }
    return faces
  }
  // For prismatic polyhedra, return their sides
  return forme.sideFaces()
}

function startMorphFaces(forme: CapstoneForme) {
  // For most things, we can just use the default and use all the faces
  if (!forme.specs.isGyroelongated()) {
    return forme.geom.faces
  }
  // gyroelongated bicupolae also have enough information to restrict
  if (forme.specs.isBi()) {
    return forme.geom.faces
  }
  // Otherwise, return every other face
  if (forme.specs.isMono()) {
    const cap = forme.caps()[0]
    return cap
      .boundary()
      .edges.filter((e) => e.face.numSides === 3)
      .flatMap((e) => {
        return [e.face, e.twinFace(), e.twin().next().twinFace()]
      })
  } else {
    const end = forme.ends()[0] as Face
    return end.edges
      .filter((e, i) => i % 2 === 0)
      .flatMap((e) => [e.twinFace(), e.twin().next().twinFace()])
  }
}

function compositeEndMorphFaces(forme: AugmentedPrismForme) {
  // The forme is an (mono-/bi-/tri-)augmented triangular prism.
  // Return everything *except* the ends of the triangular prism
  return forme.geom.faces.filter((face) => !forme.isEndFace(face))
}

// TODO these are duplicated from operations/prismOps.
// Maybe this can be the default pose generated for a capstone?
function getCapstonePose(forme: CapstoneForme, twist?: Twist): Pose {
  // special case for digonal antiprism
  if (forme.specs.isDigonal()) {
    const top = forme.ends()[0] as Edge
    const crossAxis = top.next()
    return {
      origin: forme.origin(),
      scale: forme.geom.edgeLength(),
      orientation: [top, crossAxis],
    }
  }
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
    origin: forme.centroid(),
    scale: forme.geom.edgeLength(),
    orientation: [top, top.to(edge).applyAxisAngle(top.normal(), angle)],
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
