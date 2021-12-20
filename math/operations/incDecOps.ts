import { prismaticTypes, Capstone } from "specs"
import { makeOpPair } from "./operationPairs"
import { Cap, Face, Edge } from "math/polyhedra"
import { CapstoneForme } from "math/formes"
import { getMorphFunction } from "./morph"
import { makeOperation } from "./Operation"

const getResizedVertices = getMorphFunction(
  getEndFacesToMap,
  getStartFacesToMap,
)

const incDec = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isPrimary() && !c.isPentagonal() && !c.isSnub(),
    )) {
      yield {
        left: entry,
        right: entry.withData({ base: (entry.data.base + 1) as any }),
      }
    }
    // Expand the pentagonal prism to the hexagonal prism
    for (const elongation of prismaticTypes) {
      yield {
        left: Capstone.query.withData({
          base: 5,
          type: "primary",
          count: 0,
          elongation,
          rotundaCount: 0,
        }),
        right: Capstone.query.withData({
          base: 3,
          type: "secondary",
          count: 0,
          elongation,
          rotundaCount: 0,
        }),
      }
    }
  },
  middle: "right",
  getPose(forme) {
    // special case for digonal antiprism
    if (forme.specs.isDigonal()) {
      const top = forme.ends()[0] as Edge
      const crossAxis = top.next()
      return {
        origin: forme.centroid(),
        scale: forme.geom.edgeLength(),
        orientation: [top, crossAxis],
      }
    }
    const top = forme.endBoundaries()[0]
    let crossAxis = top.edges[0]
    // If gyrolongated, we want to center on an edge
    if (forme.specs.isGyroelongated()) {
      crossAxis = crossAxis.twin().next()
    }
    return {
      // TODO should be base center
      origin: forme.origin(),
      scale: forme.geom.edgeLength(),
      orientation: [top, crossAxis],
    }
  },
  toLeft: getResizedVertices,
})

export const increment = makeOperation("increment", incDec.left)
export const decrement = makeOperation("decrement", incDec.right)

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
  if (!forme.specs.isGyroelongated()) {
    return forme.geom.faces
  }
  // If gyroelongated, choose one side opposite the aligned axis to exclude
  // FIXME digonal antiprism errors out
  const end = forme.ends()[0]
  const edges =
    end instanceof Cap
      ? end.boundary().edges
      : end instanceof Face
      ? end.edges
      : [end as Edge]
  const edge = edges[Math.floor(edges.length / 2)]

  const faces = [edge.twinFace(), edge.twin().next().twinFace()]
  // If bi, add the face on the opposite end
  if (forme.specs.isBi()) {
    faces.push(edge.twin().next().twin().prev().twinFace())
  }
  if (!forme.specs.isPrismatic()) {
    faces.push(edge.twinFace())
  }

  const indices = new Set(faces.map((f) => f.index))

  // FIXME square -> pentagonal still doesn't work
  return forme.geom.faces.filter((f) => !indices.has(f.index))
}
