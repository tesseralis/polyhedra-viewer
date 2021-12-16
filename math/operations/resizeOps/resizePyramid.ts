import { getCyclic } from "lib/utils"
import { Capstone } from "specs"
import { makeOpPair, OpPairInput } from "../operationPairs"
import { FacetOpts, TwistOpts, Pose } from "../operationUtils"
import { Face, Vertex } from "math/polyhedra"
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
function getResizedVertices(forme: CapstoneForme, result: CapstoneForme): any {
  // Exapnd/contract:
  // Get the side faces from the top and the top face of the bottom
  let [top, bottom] = forme.caps()
  const endTop = result.caps()[0]
  // If the top is misaligned, switch the bottom and top
  if (
    !top
      .adjacentFaces()
      .filter((f) => f.numSides === 3)
      .some((f) =>
        isCodirectional(
          f.normal(),
          endTop.boundary().adjacentFaces()[0].normal(),
        ),
      )
  ) {
    ;[bottom, top] = [top, bottom]
  }
  const startFaces = top
    .boundary()
    .adjacentFaces()
    .filter((f) => f.numSides === 3)

  const endBottomFace = result.ends()[1] as Face
  const bottomFace = forme.geom.faces.find((f) =>
    isCodirectional(f.normal(), endBottomFace.normal()),
  )
  if (!bottomFace) {
    throw new Error("Error finding the bottom face of the start polyhedron")
  }
  const facePairs = getFacePairs(startFaces, result.caps()[0].faces()).concat([
    [bottomFace, endBottomFace],
  ])

  // create a map from the initial vertices to the end vertices
  const mapping: Vertex[] = []
  for (const [f1, f2] of facePairs) {
    for (const [v1, v2] of getVertexPairs(f1, f2)) {
      mapping[v1.index] = v2
    }
  }
  return forme.geom.vertices.map((v) => {
    return mapping[v.index]
  })
}

function getCapstonePose(forme: CapstoneForme): Pose {
  const { geom } = forme
  const top = forme.caps()[0]
  return {
    origin: top.boundary().centroid(),
    // Use the normal of the given face as the first axis
    scale: geom.edgeLength(),
    orientation: [
      top,
      top.boundary().edges.find((e) => e.face.numSides === 3)!,
    ],
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

// Find the faces of the given sets that map onto each other
function getFacePairs(first: Face[], second: Face[]) {
  return first.map((face) => {
    const partner = second.find((face2) =>
      isCodirectional(face.normal(), face2.normal()),
    )
    if (!partner) {
      throw new Error("Something went wrong finding a partner face")
    }
    return [face, partner]
  })
}

function getVertexPairs(f1: Face, f2: Face) {
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
  return f1.vertices.map((v, i) => {
    return [v, getCyclic(f2.vertices, i + partnerIndex)] as [Vertex, Vertex]
  })
}
