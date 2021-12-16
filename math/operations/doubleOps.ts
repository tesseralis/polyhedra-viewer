import { Capstone } from "specs"
import { makeOpPair } from "./operationPairs"
import { makeOperation } from "./Operation"
import { CapstoneForme } from "math/formes"
import { Cap, Face } from "math/polyhedra"
import { getResizeFunction } from "./resizeOps/resizeUtils"

function getFacesToMap(result: CapstoneForme) {
  if (result.specs.isBi()) {
    return result.geom.faces
  }
  if (result.specs.isMono()) {
    const cap = result.caps()[0]
    if (result.specs.isElongated()) {
      // For elongated mono, include everything but the bottom cap
      return cap.boundary().edges.flatMap((e) => {
        return [e.face, e.twinFace()]
      })
    }
    // For pure pyramids, return all the faces of the cap
    return cap.faces()
  }
  // Otherwise, it's a prism, so return the side faces
  const end = result.ends()[0] as Face
  return end.adjacentFaces()
}

const getResizedVertices = getResizeFunction(getFacesToMap)

const _double = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (s) => s.isPrimary() && !s.isGyroelongated() && !s.isSnub(),
    )) {
      yield {
        left: entry,
        right: entry.withData({ type: "secondary", gyrate: "ortho" }),
      }
    }
  },
  middle: "right",
  getPose(forme) {
    // Make sure the pyramid is facing up and pick a side
    // FIXME support prisms as well
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
