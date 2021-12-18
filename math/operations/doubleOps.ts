import { Capstone, twists } from "specs"
import { makeOpPair } from "./operationPairs"
import { makeOperation } from "./Operation"
import { CapstoneForme } from "math/formes"
import { Cap, Face } from "math/polyhedra"
import { TwistOpts } from "./operationUtils"
import { getResizeFunction } from "./resizeOps/resizeUtils"

function getFacesToMap(result: CapstoneForme) {
  if (result.specs.isBi()) {
    return result.geom.faces
  }
  if (result.specs.isMono()) {
    // For mono-capstones, include the top cap
    const cap = result.caps()[0]
    let faces = cap.faces()
    // If (gyro-)elongated, add the side faces as well.
    if (!result.specs.isShortened()) {
      faces = faces.concat(result.sideFaces())
    }
    return faces
  }
  // For prismatic polyhedra, return their sides
  return result.sideFaces()
}

const getResizedVertices = getResizeFunction(getFacesToMap)

const _double = makeOpPair<Capstone, TwistOpts>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (s) => s.isPrimary() && !s.isSnub(),
    )) {
      if (entry.isGyroelongated()) {
        // FIXME digonal antiprism
        if (entry.isDigonal()) {
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
    } else {
      crossAxis = (top as Face).edges[0]
    }
    return {
      scale: forme.geom.edgeLength(),
      origin: forme.centroid(),
      orientation: [top.normal(), crossAxis],
    }
  },
  toLeft: getResizedVertices,
})

export const double = makeOperation("double", _double.left)
export const halve = makeOperation("halve", _double.right)
