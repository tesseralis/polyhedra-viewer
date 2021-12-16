import { Capstone } from "specs"
import { makeOpPair, OpPairInput } from "../operationPairs"
import { Pose } from "../operationUtils"
import { Face, Edge } from "math/polyhedra"
import { CapstoneForme } from "math/formes"
import { getResizeFunction } from "./resizeUtils"

const getResizedVertices = getResizeFunction(getFacesToMap)

function getCapstonePose(forme: CapstoneForme): Pose {
  const { geom } = forme
  const top = forme.ends()[0]
  return {
    // TODO handle pyramid
    origin: geom.centroid(),
    // Use the normal of the given face as the first axis
    scale: geom.edgeLength(),
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

type ResizeArgs<L, R> = Omit<OpPairInput<Capstone, L, R>, "graph">

function getResizeArgs<L, R>(): ResizeArgs<L, R> {
  return {
    middle: "right",
    getPose(forme) {
      return getCapstonePose(forme)
    },
    toLeft: getResizedVertices,
  }
}

const resizeArgs = getResizeArgs()

export const expand = makeOpPair<Capstone>({
  ...resizeArgs,
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
})

export const snub = makeOpPair<Capstone>({
  ...resizeArgs,
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
})

export const twist = makeOpPair<Capstone>({
  ...getResizeArgs(),
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
})

// get the result faces to map the start faces too
function getFacesToMap(result: CapstoneForme) {
  if (result.specs.isPyramid()) {
    return result.geom.faces
  }
  // for a twist operation, the end result is the bicupola
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
}
