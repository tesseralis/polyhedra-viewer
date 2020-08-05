import { Capstone } from "specs"
import { makeOpPair } from "../operationPairs"
import { getTransformedVertices, FacetOpts } from "../operationUtils"
import CapstoneForme from "math/formes/CapstoneForme"

function getCapstoneCrossAxis(forme: CapstoneForme) {
  const topBoundary = forme.endBoundaries()[0]
  if (forme.specs.isSecondary()) {
    return topBoundary.edges.find((e) => e.face.numSides === 4)!
  }
  if (forme.specs.isPrismatic()) {
    return topBoundary.edges[0]
  }
  return topBoundary.vertices[0]
}

function getApothem(s: number, n: number) {
  return s / 2 / Math.tan(Math.PI / n)
}

function contractToPrism(forme: CapstoneForme) {
  const faces = forme.geom.faces.filter((f) => forme.isFacetFace(f, "face"))
  return getTransformedVertices(faces, (face) => {
    if (forme.isTop(face)) {
      return face.translateNormal(
        forme.prismaticHeight() / 2 - face.distanceToCenter(),
      )
    } else {
      const apothem = getApothem(face.sideLength(), forme.specs.data.base)
      return face.translateNormal(apothem - face.distanceToCenter())
    }
  })
}

function contractToBipyramid(forme: CapstoneForme) {
  const faces = forme.geom.faces.filter((f) => forme.isFacetFace(f, "vertex"))
  return getTransformedVertices(faces, (face) => {
    const sideFace = face
      .adjacentFaces()
      .find((f) => !forme.isContainedInEnd(f))!
    const apothem = getApothem(face.sideLength(), forme.specs.data.base)
    const horiz = sideFace.translateNormal(
      apothem - sideFace.distanceToCenter(),
    )
    const topFace = face.vertices
      .flatMap((v) => v.adjacentFaces())
      .find((f) => forme.isTop(f))!
    const vert = topFace.translateNormal(-forme.prismaticHeight() / 2)
    return horiz.multiply(vert)
  })
}

export const expand = makeOpPair<CapstoneForme, {}, FacetOpts>({
  graph: function* () {
    for (const specs of Capstone.query.where(
      (cap) =>
        cap.isSecondary() &&
        cap.isBi() &&
        cap.isElongated() &&
        cap.isOrtho() &&
        cap.isCupola(),
    )) {
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
  getPose(pos, forme) {
    const crossAxis = getCapstoneCrossAxis(forme)
    const cross = crossAxis.centroid().clone().sub(forme.ends()[0].centroid())
    return {
      origin: forme.centroid(),
      scale: forme.geom.edgeLength(),
      orientation: [forme.ends()[0].normal(), cross],
    }
  },
  toLeft(forme, { right: { facet } }) {
    return facet === "face"
      ? contractToPrism(forme)
      : contractToBipyramid(forme)
  },
})

export const dual = makeOpPair<CapstoneForme>({
  graph: function* () {
    for (const specs of Capstone.query.where(
      (cap) =>
        cap.isSecondary() &&
        cap.isBi() &&
        cap.isElongated() &&
        cap.isOrtho() &&
        cap.isCupola(),
    )) {
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
  getPose(pos, forme) {
    const crossAxis = getCapstoneCrossAxis(forme)
    const cross = crossAxis.centroid().clone().sub(forme.ends()[0].centroid())
    return {
      origin: forme.centroid(),
      scale: forme.geom.edgeLength(),
      orientation: [forme.ends()[0].normal(), cross],
    }
  },
  toLeft: (forme) => contractToPrism(forme),
  toRight: (forme) => contractToBipyramid(forme),
})
