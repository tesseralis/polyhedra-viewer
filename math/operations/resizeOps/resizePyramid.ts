import { minBy, range } from "lodash-es"
import { getCyclic } from "lib/utils"
import { Capstone } from "specs"
import { makeOpPair, OpPairInput } from "../operationPairs"
import { FacetOpts, TwistOpts, Pose } from "../operationUtils"
import { Face, Edge, Vertex } from "math/polyhedra"
import { CapstoneForme } from "math/formes"
import { isCodirectional } from "math/geom"

/**
 * Return the expanded vertices of the polyhedron resized to the given distance-from-center
 * and rotated by the given angle
 *
 * @param faces the faces to transform
 * @param distance the normalized distance from center to put those faces
 * @param angle the angle to twist the faces by
 */
function getResizedVertices(forme: CapstoneForme, result: CapstoneForme) {
  const isSnub = forme.specs.isSnub()
  const facePairs = getFacePairs(
    forme.geom.faces,
    getFacesToMap(result),
    isSnub,
  )

  // create a map from the initial vertices to the end vertices
  const mapping: Vertex[] = []
  for (const [f1, f2] of facePairs) {
    for (const [v1, v2] of getVertexPairs(f1, f2, isSnub)) {
      mapping[v1.index] = v2
    }
  }
  const res = forme.geom.vertices.map((v) => {
    return mapping[v.index]
  })
  return res
}

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
    toLeft(forme, $, result) {
      return getResizedVertices(forme, result)
    },
  }
}

const resizeArgs = getResizeArgs<{}, FacetOpts>()

export const expand = makeOpPair<Capstone, {}, FacetOpts>({
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

export const snub = makeOpPair<Capstone, TwistOpts, FacetOpts>({
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

export const twist = makeOpPair<Capstone, TwistOpts, {}>({
  ...getResizeArgs(),
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isCupola() && c.isBi() && c.isShortened() && !c.isPentagonal(),
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

// Find the faces in the first set that map onto the second set
function getFacePairs(first: Face[], second: Face[], isSnub?: boolean) {
  return second.map((face) => {
    return [findFacePartner(face, first, isSnub), face]
  })
}

function findFacePartner(face: Face, candidates: Face[], isSnub?: boolean) {
  if (isSnub) {
    return minBy(candidates, (face2) => {
      return face.normal().angleTo(face2.normal())
    })!
  } else {
    const partner = candidates.find((face2) =>
      isCodirectional(face.normal(), face2.normal()),
    )
    if (!partner) {
      throw new Error("Something went wrong finding a partner face")
    }
    return partner
  }
}

function getVertexPairs(f1: Face, f2: Face, isSnub?: boolean) {
  const partnerIndex = getPartnerVertexIndex(f1, f2, isSnub)
  return f1.vertices.map((v, i) => {
    return [v, getCyclic(f2.vertices, i + partnerIndex)] as [Vertex, Vertex]
  })
}

function getPartnerVertexIndex(f1: Face, f2: Face, isSnub?: boolean) {
  const v0 = f1.vertices[0]
  if (isSnub) {
    // snub vertices aren't aligned, so get the closest one
    return minBy(range(0, f2.numSides), (i) => {
      const v = f2.vertices[i]
      return f1
        .centroid()
        .clone()
        .sub(v0.vec)
        .angleTo(f2.centroid().clone().sub(v.vec))
    })!
  }
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
