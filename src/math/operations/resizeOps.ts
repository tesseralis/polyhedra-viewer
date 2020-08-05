import {
  Classical,
  Capstone,
  Facet,
  oppositeFacet,
  twists,
  oppositeTwist,
} from "specs"
import {
  makeOpPair,
  combineOps,
  OpPairInput,
  GraphOpts,
} from "./operationPairs"
import {
  getTransformedVertices,
  FacetOpts,
  TwistOpts,
  Pose,
} from "./operationUtils"
import Operation, { makeOperation } from "./Operation"
import PolyhedronForme from "math/formes/PolyhedronForme"
import ClassicalForme from "math/formes/ClassicalForme"
import CapstoneForme from "math/formes/CapstoneForme"

/**
 * Return the expanded vertices of the polyhedron resized to the given distance-from-center
 * and rotated by the given angle
 *
 * @param faces the faces to transform
 * @param distance the normalized distance from center to put those faces
 * @param angle the angle to twist the faces by
 */
function getResizedVertices(
  forme: ClassicalForme,
  facet: Facet,
  result: Classical,
) {
  const resultForme = ClassicalForme.fromSpecs(result)
  const angle = forme.snubAngle(facet)
  const distance = resultForme.inradius(facet) / resultForme.geom.edgeLength()
  const scale = forme.geom.edgeLength() * distance - forme.inradius(facet)
  return getTransformedVertices(forme.facetFaces(facet), (f) => {
    const rotateM = f.rotateNormal(angle)
    const translateM = f.translateNormal(scale)
    return f.withCentroidOrigin(rotateM.premultiply(translateM))
  })
}

function getClassicalPose(forme: ClassicalForme, facet: Facet): Pose {
  const { geom } = forme
  return {
    // Always centered on centroid
    origin: geom.centroid(),
    // Use the normal of the given face as the first axis
    scale: geom.edgeLength(),
    orientation: forme
      .adjacentFacetFaces(facet)
      .map((face) => face.normal()) as any,
  }
}

type ResizeArgs<L, R> = Omit<OpPairInput<ClassicalForme, L, R>, "graph">

function getResizeArgs<L, R>(
  getFacet: (opts: GraphOpts<L, R>) => Facet,
): ResizeArgs<L, R> {
  return {
    middle: "right",
    getPose(pos, forme, options) {
      return getClassicalPose(forme, getFacet(options))
    },
    toLeft(forme, options, result) {
      return getResizedVertices(forme, getFacet(options), result)
    },
  }
}

const resizeArgs = getResizeArgs<{}, FacetOpts>((opts) => opts.right.facet)

// Expansion of truncated to bevelled solids
const semiExpand = makeOpPair<ClassicalForme, {}, FacetOpts>({
  ...resizeArgs,
  graph: function* () {
    for (const entry of Classical.allWithOperation("truncate")) {
      yield {
        left: entry,
        right: entry.withOperation("bevel"),
        options: { left: {}, right: { facet: entry.facet() } },
      }
    }
  },
})

const _expand = makeOpPair<ClassicalForme, {}, FacetOpts>({
  ...resizeArgs,
  graph: function* () {
    for (const entry of Classical.allWithOperation("regular")) {
      yield {
        left: entry,
        right: entry.withOperation("cantellate"),
        options: { left: {}, right: { facet: entry.facet() } },
      }
    }
  },
})

const _snub = makeOpPair<ClassicalForme, TwistOpts, FacetOpts>({
  ...resizeArgs,
  graph: function* () {
    for (const entry of Classical.allWithOperation("regular")) {
      for (const twist of twists) {
        yield {
          left: entry,
          // If a vertex-solid, the chirality of the result
          // is *opposite* of the twist option
          right: entry.withOperation(
            "snub",
            entry.isVertex() ? oppositeTwist(twist) : twist,
          ),
          options: { left: { twist }, right: { facet: entry.facet() } },
        }
      }
    }
  },
})

const _twist = makeOpPair<ClassicalForme, TwistOpts, {}>({
  ...getResizeArgs(() => "face"),
  graph: function* () {
    for (const entry of Classical.allWithOperation("cantellate")) {
      for (const twist of twists) {
        yield {
          left: entry,
          right: entry.withOperation("snub", twist),
          options: { left: { twist }, right: {} },
        }
      }
    }
  },
})

function getCantellatedMidradius(forme: ClassicalForme) {
  return forme.edgeFace().distanceToCenter()
}

/**
 * Take the cantellated intermediate solid and convert it to either dual
 */
function doDualTransform(forme: ClassicalForme, result: Classical) {
  const resultForme = ClassicalForme.fromSpecs(result)
  const resultSideLength =
    getCantellatedMidradius(forme) / resultForme.midradius()
  const scale = resultSideLength * resultForme.circumradius()
  const faces = forme.facetFaces(oppositeFacet(result.facet()))
  return getTransformedVertices(faces, (f) => {
    return forme.geom.centroid().clone().addScaledVector(f.normal(), scale)
  })
}

const _dual = makeOpPair<ClassicalForme>({
  graph: function* () {
    for (const specs of Classical.query.where(
      (s) => s.isRegular() && !s.isVertex(),
    )) {
      yield { left: specs, right: specs.withData({ facet: "vertex" }) }
    }
  },
  middle: (entry) => entry.left.withOperation("cantellate"),
  getPose(pos, forme) {
    const { geom } = forme
    switch (pos) {
      case "left": {
        return {
          ...getClassicalPose(forme, "face"),
          // Everything is scaled with the same midradius
          scale: forme.midradius(),
        }
      }
      case "right": {
        // for the vertex figure, pick a vertex and align it with that edge
        const vertex = geom.getVertex()
        const v2 = vertex.adjacentVertices()[0]
        return {
          origin: geom.centroid(),
          scale: forme.midradius(),
          orientation: [vertex.normal(), v2.normal()],
        }
      }
      case "middle": {
        return {
          ...getClassicalPose(forme, "face"),
          scale: getCantellatedMidradius(forme),
        }
      }
    }
  },
  toLeft: (forme, _, result) => doDualTransform(forme, result),
  toRight: (forme, _, result) => doDualTransform(forme, result),
})

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

const expandPrism = makeOpPair<CapstoneForme, {}, FacetOpts>({
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

const dualPrism = makeOpPair<CapstoneForme>({
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

// Exported members

export const dual = new Operation(
  "dual",
  combineOps<ClassicalForme | CapstoneForme, {}>([
    _dual.left,
    _dual.right,
    dualPrism.left,
    dualPrism.right,
  ]),
)

export const expand = new Operation(
  "expand",
  combineOps<PolyhedronForme, {}>([
    semiExpand.left,
    _expand.left,
    expandPrism.left,
  ]),
)

export const snub = makeOperation("snub", _snub.left)

export const twist = makeOperation(
  "twist",
  combineOps([_twist.left, _twist.right]),
)

export const contract = makeOperation<
  FacetOpts,
  ClassicalForme | CapstoneForme
>("contract", {
  ...combineOps<ClassicalForme | CapstoneForme, FacetOpts>(
    [_expand, _snub, semiExpand, expandPrism].map((op) => op.right),
  ),

  hitOption: "facet",
  getHitOption(forme, hitPoint) {
    const hitFace = forme.geom.hitFace(hitPoint)
    const facet = forme.getFacet(hitFace)
    return facet ? { facet } : {}
  },

  selectionState(face, forme, { facet }) {
    if (facet && forme.isFacetFace(face, facet)) return "selected"
    if (forme.isAnyFacetFace(face)) return "selectable"
    return undefined
  },
})
