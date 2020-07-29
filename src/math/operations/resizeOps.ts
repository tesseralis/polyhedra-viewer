import { Twist } from "types"
import { mapObject } from "utils"
import Classical, { Facet, Family } from "data/specs/Classical"
import { makeOpPair, combineOps } from "./operationPairs"
import { withOrigin } from "math/geom"
import { Face } from "math/polyhedra"
import {
  getOppTwist,
  getTransformedVertices,
  // FacetOpts,
  // TwistOpts,
  getGeometry,
  Pose,
} from "./operationUtils"
import Operation, { makeOperation } from "./Operation"
import ClassicalForme from "math/formes/ClassicalForme"

interface FacetOpts {
  facet: Facet
}

interface TwistOpts {
  twist: Twist
}

/**
 * Return the expanded vertices of the polyhedron resized to the given distance-from-center
 * and rotated by the given angle
 *
 * @param faces the faces to transform
 * @param distance the normalized distance from center to put those faces
 * @param angle the angle to twist the faces by
 */
function getResizedVertices(
  faces: Face[],
  distance: number,
  angle: number = 0,
) {
  const resizedLength = faces[0].sideLength() * distance
  const f0 = faces[0]
  const scale = resizedLength - f0.distanceToCenter()
  return getTransformedVertices(faces, (f) =>
    withOrigin(f.centroid(), (v) =>
      v.getRotatedAroundAxis(f.normal(), angle).add(f.normal().scale(scale)),
    ),
  )
}

function getSchafli(specs: Classical) {
  return specs.isFace() ? [specs.data.family, 3] : [3, specs.data.family]
}

const coxeterNum = { 3: 4, 4: 6, 5: 10 }

const { sin, cos, tan, PI } = Math

// get tan(theta/2) where theta is the dihedral angle of the platonic solid
function tanDihedralOver2(specs: Classical) {
  const [, q] = getSchafli(specs)
  const h = coxeterNum[specs.data.family]
  return cos(PI / q) / sin(PI / h)
}

function getInradius(specs: Classical) {
  const [p] = getSchafli(specs)
  return tanDihedralOver2(specs) / tan(PI / p) / 2
}

function getMidradius(specs: Classical) {
  const [p] = getSchafli(specs)
  const h = coxeterNum[specs.data.family]
  return cos(PI / p) / sin(PI / h) / 2
}

function getCircumradius(specs: Classical) {
  const [, q] = getSchafli(specs)
  return (tan(PI / q) * tanDihedralOver2(specs)) / 2
}

function createObject<T extends string | number, U>(
  items: T[],
  iter: (item: T) => U,
) {
  return mapObject(items, (item) => [item, iter(item)])
}

// TODO deduplicate these (note: bevel has a different criterion for getting face)
// FIXME move all these to a function on the Forme
const cantellatedDists = createObject([3, 4, 5], (family: Family) => {
  const specs = Classical.query.withData({ family, operation: "cantellate" })
  const geom = getGeometry(specs)
  const forme = ClassicalForme.create(specs, geom)
  const face = forme.facetFace("face")
  return face.distanceToCenter() / geom.edgeLength()
})

function calcTruncatedDist(family: Family, facet: Facet) {
  const specs = Classical.query.withData({
    family,
    operation: "truncate",
    facet,
  })
  const geom = getGeometry(specs)
  const face = geom.largestFace()
  return face.distanceToCenter() / geom.edgeLength()
}

const bevelledDists = createObject([3, 4, 5], (family: Family) => {
  return {
    face: calcTruncatedDist(family, "face"),
    vertex: calcTruncatedDist(family, "vertex"),
  }
})

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

const twistOpts: Twist[] = ["left", "right"]

// Expansion of truncated to bevelled solids
const semiExpand = makeOpPair<Classical, ClassicalForme, {}, FacetOpts>({
  graph: Classical.query
    .where((s) => s.isTruncated())
    .map((entry) => ({
      left: entry,
      right: entry.withData({ operation: "bevel" }),
      options: { left: {}, right: { facet: entry.data.facet! } },
    })),
  middle: "right",
  getPose(pos, forme, { right: { facet } }) {
    return getClassicalPose(forme, facet)
  },
  toLeft(forme, { right: { facet } }) {
    return getResizedVertices(
      forme.facetFaces(facet),
      bevelledDists[forme.specs.data.family][facet],
    )
  },
})

const _expand = makeOpPair<Classical, ClassicalForme, {}, FacetOpts>({
  graph: Classical.query
    .where((s) => s.isRegular())
    .map((entry) => {
      return {
        left: entry,
        right: entry.withData({ operation: "cantellate" }),
        options: { left: {}, right: { facet: entry.data.facet! } },
      }
    }),

  middle: "right",

  getPose(pos, forme, { right: { facet } }) {
    return getClassicalPose(forme, facet)
  },
  toLeft(forme, { right: { facet } }, result) {
    // Take all the stuff and push it inwards
    return getResizedVertices(
      // FIXME get rid of the adjustment
      forme.facetFaces(facet),
      getInradius(result),
    )
  },
})

const _snub = makeOpPair<Classical, ClassicalForme, TwistOpts, FacetOpts>({
  graph: Classical.query
    .where((s) => s.isRegular())
    .flatMap((entry) => {
      return twistOpts.map((twist) => ({
        left: entry,
        right: entry.withData({
          operation: "snub",
          // If a vertex-solid, the chirality of the result
          // is *opposite* of the twist option
          twist: entry.isVertex() ? getOppTwist(twist) : twist,
        }),
        options: { left: { twist }, right: { facet: entry.data.facet! } },
      }))
    }),

  middle: "right",

  getPose(pos, forme, { right: { facet } }) {
    return getClassicalPose(forme, facet)
  },
  toLeft(forme, { right: { facet } }, result) {
    // Take all the stuff and push it inwards
    return getResizedVertices(
      forme.facetFaces(result.data.facet!),
      getInradius(result),
      forme.snubAngle(facet),
    )
  },
})

const _twist = makeOpPair<Classical, ClassicalForme, TwistOpts, {}>({
  graph: Classical.query
    .where((s) => s.isCantellated())
    .flatMap((entry) => {
      return twistOpts.map((twist) => ({
        left: entry,
        right: entry.withData({ operation: "snub", twist }),
        options: { left: { twist }, right: {} },
      }))
    }),

  middle: "right",

  getPose(pos, forme) {
    return getClassicalPose(forme, "face")
  },
  toLeft(forme) {
    return getResizedVertices(
      forme.facetFaces("face"),
      cantellatedDists[forme.specs.data.family],
      forme.snubAngle("face"),
    )
  },
})

function getCantellatedMidradius(forme: ClassicalForme) {
  return forme.edgeFace().distanceToCenter()
}

/**
 * Take the cantellated intermediate solid and convert it to either dual
 */
function doDualTransform(forme: ClassicalForme, facet: Facet) {
  const { specs, geom } = forme
  const resultSpecs = specs.withData({ operation: "regular", facet })
  const resultSideLength =
    getCantellatedMidradius(forme) / getMidradius(resultSpecs)
  const scale = resultSideLength * getCircumradius(resultSpecs)
  const oppFacet = facet === "face" ? "vertex" : "face"
  const faces = forme.facetFaces(oppFacet)
  return getTransformedVertices(faces, (f) => {
    return geom.centroid().add(f.normal().scale(scale))
  })
}

const _dual = makeOpPair<Classical, ClassicalForme>({
  graph: Classical.query
    .where((s) => s.isRegular() && !s.isVertex())
    .map((specs) => ({
      left: specs,
      right: specs.withData({ facet: "vertex" }),
    })),
  middle: (entry) => entry.left.withData({ operation: "cantellate" }),
  getPose(pos, forme) {
    const { geom } = forme
    switch (pos) {
      case "left": {
        return {
          ...getClassicalPose(forme, "face"),
          // Everything is scaled with the same midradius
          scale: geom.edges[0].distanceToCenter(),
        }
      }
      case "right": {
        // for the vertex figure, pick a vertex and align it with that edge
        const vertex = geom.getVertex()
        const normal = vertex.vec.sub(geom.centroid())
        const v2 = vertex.adjacentVertices()[0]
        return {
          origin: geom.centroid(),
          scale: geom.edges[0].distanceToCenter(),
          orientation: [normal, v2.vec.sub(vertex.vec)],
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
  toLeft: (forme) => doDualTransform(forme, "face"),
  toRight: (forme) => doDualTransform(forme, "vertex"),
})

// Exported members

export const dual = new Operation("dual", combineOps([_dual.left, _dual.right]))

export const expand = new Operation(
  "expand",
  combineOps([semiExpand.left, _expand.left]),
)

export const snub = makeOperation("snub", _snub.left)

export const twist = makeOperation(
  "twist",
  combineOps([_twist.left, _twist.right]),
)

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract = makeOperation<FacetOpts, Classical, ClassicalForme>(
  "contract",
  {
    ...combineOps([_expand, _snub, semiExpand].map((op) => op.right)),

    hitOption: "facet",
    getHitOption(forme, hitPoint) {
      const hitFace = forme.geom.hitFace(hitPoint)
      const facet = forme.getFacet(hitFace)
      return facet ? { facet } : {}
    },

    faceSelectionStates(forme, { facet }) {
      return forme.geom.faces.map((face) => {
        if (forme.isFacetFace(face, facet)) return "selected"
        if (forme.isAnyFacetFace(face)) return "selectable"
        return undefined
      })
    },
  },
)
