import { Capstone, Composite, twists } from "specs"
import { makeOpPair, combineOps } from "./operationPairs"
import { makeOperation } from "./Operation"
import { CapstoneForme, CompositeForme } from "math/formes"
import { Cap, Face, Edge } from "math/polyhedra"
import { TwistOpts } from "./operationUtils"
import { getMorphFunction } from "./morph"
import { AugmentedPrismForme } from "math/formes/CompositeForme"

const morphVertices = getMorphFunction(endMorphFaces, startMorphFaces)
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
  getPose(forme) {
    // Make sure the pyramid is facing up and pick a side
    const [top] = forme.ends()
    let crossAxis
    if (top instanceof Cap) {
      crossAxis = forme.specs.isPyramid()
        ? top.boundary().edges[0]
        : top.boundary().edges.find((e) => e.face.numSides === 3)!
    } else if (top instanceof Face) {
      crossAxis = top.edges[0]
    } else {
      // TODO antiprism are asymmetric:
      // the aligned end is matched and the bottom end twists
      // This might also be causing the pentagonal class to be broken?
      crossAxis = (top as Edge).face
    }
    return {
      scale: forme.geom.edgeLength(),
      origin: forme.centroid(),
      orientation: [top.normal(), crossAxis],
    }
  },
  toLeft: morphVertices,
})

const morphVerticesComposite = getMorphFunction(compositeEndMorphFaces)
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
  toLeft: morphVerticesComposite,
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
