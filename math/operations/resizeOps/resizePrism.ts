import { Capstone } from "specs"
import { makeOpPair } from "../operationPairs"
import { Pose, FacetOpts } from "../operationUtils"
import { CapstoneForme } from "math/formes"
import { getMorphFunction } from "../morph"

const morph = getMorphFunction()

export const expand = makeOpPair<Capstone, {}, FacetOpts>({
  graph: function* () {
    for (const specs of elongatedOrthobicupolae()) {
      yield {
        left: specs.withData({ count: 0, type: "primary" }),
        right: specs,
        options: {
          left: {},
          right: { facet: "face" },
        },
      }
      yield {
        left: specs.withData({ elongation: "none", type: "primary" }),
        right: specs,
        options: {
          left: {},
          right: { facet: "vertex" },
        },
      }
    }
  },
  intermediate: "right",
  getPose,
  toLeft: morph,
})

export const dual = makeOpPair<Capstone>({
  graph: function* () {
    for (const specs of elongatedOrthobicupolae()) {
      yield {
        left: specs.withData({ count: 0, type: "primary" }),
        right: specs.withData({ elongation: "none", type: "primary" }),
      }
    }
  },
  intermediate: (entry) =>
    entry.right.withData({
      elongation: "prism",
      type: "secondary",
      gyrate: "ortho",
    }),
  getPose,
  toLeft: morph,
  toRight: morph,
})

function getPose(forme: CapstoneForme): Pose {
  const top = forme.ends()[0]
  const crossAxis = getCapstoneCrossAxis(forme)
  return {
    origin: forme.origin(),
    scale: forme.geom.edgeLength(),
    orientation: [top, crossAxis],
  }
}

function getCapstoneCrossAxis(forme: CapstoneForme) {
  const topBoundary = forme.endBoundaries()[0]
  // for the bicupolae, find an edge connected to a square cupola face
  if (forme.specs.isSecondary()) {
    return topBoundary.edges.find((e) => e.face.numSides === 4)!
  }
  // For prisms, it can be any edge
  if (forme.specs.isPrismatic()) {
    return topBoundary.edges[0]
  }
  // For bipyramids, it's vertex-centered
  return topBoundary.vertices[0]
}

function* elongatedOrthobicupolae() {
  for (const specs of Capstone.query.where(
    (cap) => cap.isCupola() && cap.isBi() && cap.isElongated() && cap.isOrtho(),
  )) {
    yield specs
  }
}
