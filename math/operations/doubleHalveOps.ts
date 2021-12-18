import { Capstone, twists } from "specs"
import { makeOpPair } from "./operationPairs"
import { makeOperation } from "./Operation"
import { CapstoneForme } from "math/formes"
import { Cap, Face, Edge } from "math/polyhedra"
import { TwistOpts } from "./operationUtils"
import { getResizeFunction } from "./resizeOps/resizeUtils"

const getResizedVertices = getResizeFunction(
  getEndFacesToMap,
  getStartFacesToMap,
)

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
  toLeft: getResizedVertices,
})

export const double = makeOperation("double", doubleHalve.left)
export const halve = makeOperation("halve", doubleHalve.right)

function getEndFacesToMap(forme: CapstoneForme) {
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

function getStartFacesToMap(forme: CapstoneForme) {
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
