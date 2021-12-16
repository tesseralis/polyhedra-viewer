import { getCyclic } from "lib/utils"
import { Capstone } from "specs"
import { makeOpPair } from "../operationPairs"
import { Pose, FacetOpts } from "../operationUtils"
import { CapstoneForme } from "math/formes"
import { Face, Vertex } from "math/polyhedra"
import { isCodirectional } from "math/geom"

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

function getPose(forme: CapstoneForme): Pose {
  const top = forme.ends()[0]
  const crossAxis = getCapstoneCrossAxis(forme)
  return {
    origin: forme.centroid(),
    scale: forme.geom.edgeLength(),
    orientation: [top, crossAxis],
  }
}

function* elongatedOrthobicupolae() {
  for (const specs of Capstone.query.where(
    (cap) => cap.isCupola() && cap.isBi() && cap.isElongated() && cap.isOrtho(),
  )) {
    yield specs
  }
}

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
  middle: "right",
  getPose,
  toLeft(forme, $, result) {
    return getResizedVertices(forme, result)
  },
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
  middle: (entry) =>
    entry.right.withData({
      elongation: "prism",
      type: "secondary",
      gyrate: "ortho",
    }),
  getPose,
  toLeft(forme, $, result) {
    return getResizedVertices(forme, result)
  },
  toRight(forme, $, result) {
    return getResizedVertices(forme, result)
  },
})

function getResizedVertices(forme: CapstoneForme, result: CapstoneForme) {
  const facePairs = getFacePairs(forme.geom.faces, getFacesToMap(result))

  // create a map from the initial vertices to the end vertices
  const mapping: Vertex[] = []
  for (const [f1, f2] of facePairs) {
    for (const [v1, v2] of getVertexPairs(f1, f2)) {
      mapping[v1.index] = v2
    }
  }
  const res = forme.geom.vertices.map((v) => {
    return mapping[v.index]
  })
  return res
}

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

// Find the faces in the first set that map onto the second set
function getFacePairs(first: Face[], second: Face[]) {
  return second.map((face) => {
    return [findFacePartner(face, first), face]
  })
}

function findFacePartner(face: Face, candidates: Face[]) {
  const partner = candidates.find((face2) =>
    isCodirectional(face.normal(), face2.normal()),
  )
  if (!partner) {
    throw new Error("Something went wrong finding a partner face")
  }
  return partner
}

function getVertexPairs(f1: Face, f2: Face) {
  const partnerIndex = getPartnerVertexIndex(f1, f2)
  return f1.vertices.map((v, i) => {
    return [v, getCyclic(f2.vertices, i + partnerIndex)] as [Vertex, Vertex]
  })
}

function getPartnerVertexIndex(f1: Face, f2: Face) {
  const v0 = f1.vertices[0]
  const partnerIndex = f2.vertices.findIndex((v) =>
    isCodirectional(
      f1.centroid().clone().sub(v0.vec),
      f2.centroid().clone().sub(v.vec),
    ),
  )
  if (partnerIndex < 0) {
    throw new Error("Something went wrong finding a partner vertex")
  }
  return partnerIndex
}
