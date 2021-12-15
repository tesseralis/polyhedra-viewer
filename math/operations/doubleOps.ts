import { Capstone } from "specs"
import { makeOpPair } from "./operationPairs"
import { makeOperation } from "./Operation"
import { getTransformedVertices } from "./operationUtils"
import { CapstoneForme } from "math/formes"
import { Cap, Edge, Face, VertexList } from "math/polyhedra"
import { Matrix4 } from "three"
import { translateMat } from "math/geom"

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
  toLeft(forme) {
    // TODO animate it back into a pyramid
    return getTransformedVertices(getSlices(forme), (slice: any) => {
      return slice.translation
    })
  },
})

export const double = makeOperation("double", _double.left)
export const halve = makeOperation("halve", _double.right)

// Get the slices of vertex to halve and the transform to push it in
function getSlices(
  forme: CapstoneForme,
): (VertexList & { translation: Matrix4 })[] {
  // Get the top boundary
  const [top] = forme.ends()
  // If it's a prism (and thus the whole thing is a prism)
  // just pick every other side
  if (top instanceof Face) {
    const scale =
      (getApothem(top.numSides) - getApothem(top.numSides / 2)) /
      getApothem(top.numSides)
    return top.edges
      .filter((e, i) => i % 2 === 0)
      .map((edge) => {
        return {
          vertices: edge.twinFace().vertices,
          polyhedron: forme.geom,
          translation: translateMat(
            top.centroid().clone().sub(edge.midpoint()).multiplyScalar(scale),
          ),
        }
      })
  } else {
    // Otherwise, it's a cupola, so pick the attached faces that are triangles
    // and return the slice
    const boundary = (top as Cap).boundary()
    const scale =
      (getApothem(boundary.numSides) - getApothem(boundary.numSides / 2)) /
      getApothem(boundary.numSides)
    return boundary.edges
      .filter((e) => e.face.numSides === 3)
      .map((edge) => {
        return {
          vertices: getSlice(edge, forme.specs),
          polyhedron: forme.geom,
          translation: translateMat(
            boundary
              .centroid()
              .clone()
              .sub(edge.midpoint())
              .multiplyScalar(scale),
          ),
        }
      })
  }
}

function getSlice(edge: Edge, specs: Capstone) {
  let vertices = [...edge.face.vertices]
  let twin = edge.twin()
  // If elongated, add the attached side face and update the twin pointer to the opposite side
  if (specs.isElongated()) {
    vertices = vertices.concat(twin.face.vertices)
    twin = twin.next().next().twin()
  }
  if (specs.isBi()) {
    vertices = vertices.concat(twin.face.vertices)
  }
  return vertices
}

function getApothem(n: number) {
  return 1 / 2 / Math.tan(Math.PI / n)
}
