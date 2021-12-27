import { Capstone } from "specs"
import { makeOpPair } from "../operationPairs"
import { Pose } from "../operationUtils"
import { Face, Edge } from "math/polyhedra"
import { CapstoneForme } from "math/formes"

export const expand = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isPyramid() && c.isMono() && c.isShortened(),
    )) {
      yield {
        left: entry,
        right: entry.withData({ type: "secondary", count: 2, gyrate: "gyro" }),
      }
    }
  },
  intermediate: "right",
  getPose,
})

export const snub = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) =>
        c.isPyramid() && c.isMono() && c.isShortened() && !c.isPentagonal(),
    )) {
      yield {
        left: entry,
        right: entry.withElongation("snub"),
      }
    }
  },
  intermediate: "right",
  getPose,
})

export const twist = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) =>
        c.isCupola() &&
        c.isGyro() &&
        c.isBi() &&
        c.isShortened() &&
        !c.isPentagonal(),
    )) {
      yield {
        left: entry,
        right: entry.withElongation("snub"),
      }
    }
  },
  intermediate: "right",
  getPose,
  toLeft: {
    sideFacets(result) {
      // The end result is the gyrobicupola, so only track the triangular faces of the caps.
      return result.caps().flatMap((cap) => {
        const items = cap
          .boundary()
          .adjacentFaces()
          .filter((f) => f.numSides === 3)
        if (!result.specs.isDigonal()) {
          items.push(cap.topFace())
        }
        return items
      })
    },
  },
})

export const dual = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isPyramid() && c.isMono() && c.isShortened(),
    )) {
      yield { left: entry, right: entry }
    }
  },
  intermediate: (entry) =>
    entry.left.withData({ type: "secondary", count: 2, gyrate: "gyro" }),
  getPose(forme, $, side) {
    if (side === "right") {
      const top = forme.caps()[0]
      return {
        origin: forme.origin(),
        scale: forme.geom.edgeLength(),
        orientation: [
          top.normal().clone().negate(),
          top.boundary().vertices[0],
        ],
      }
    }
    return getPose(forme)
  },
})

function getPose(forme: CapstoneForme): Pose {
  const top = forme.ends()[0]
  return {
    origin: forme.origin(),
    // Use the normal of the given face as the first axis
    scale: forme.geom.edgeLength(),
    orientation: [top, getCrossAxis(forme)],
  }
}

function getCrossAxis(forme: CapstoneForme) {
  if (forme.specs.isSnub()) {
    // If it's snub, use the top to find the facet face
    const top = forme.ends()[0]
    const e = top instanceof Face ? top.edges[0] : (top as Edge)
    return e.twin().next().twinFace()
  } else {
    const top = forme.caps()[0]
    return top.boundary().edges.find((e) => e.face.numSides === 3)!
  }
}
