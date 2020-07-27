import { minBy } from "lodash-es"
import { Twist } from "types"
import { mapObject } from "utils"
import Classical, { Facet, Family } from "data/specs/Classical"
import { makeOpPair, combineOps, Pose } from "./operationPairs"
import { angleBetween, getPlane, withOrigin, Vec3D } from "math/geom"
import { Polyhedron, Face, Edge } from "math/polyhedra"
import {
  getOppTwist,
  getTransformedVertices,
  // FacetOpts,
  // TwistOpts,
  getGeometry,
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

function apothemVec(edge: Edge) {
  return edge.midpoint().sub(edge.face.centroid())
}

/**
 * Return the snub angle of the given polyhedron, given the list of expanded faces
 */
export function calcSnubAngle(specs: Classical, facet: Facet) {
  // Choose one of the expanded faces and get its properties
  const polyhedron = getGeometry(specs)
  const forme = ClassicalForme.create(specs, polyhedron)
  const [face0, ...rest] = forme.facetFaces(facet)
  const faceCentroid = face0.centroid()
  const midpoint = face0.edges[0].midpoint()

  // Choose one of the closest faces
  const face1 = minBy(rest, (face) => midpoint.distanceTo(face.centroid()))!

  const plane = getPlane([
    faceCentroid,
    face1.centroid(),
    polyhedron.centroid(),
  ])

  // Calculate the absolute angle between the two midpoints
  return angleBetween(faceCentroid, midpoint, plane.getProjectedPoint(midpoint))
}

function createObject<T extends string | number, U>(
  items: T[],
  iter: (item: T) => U,
) {
  return mapObject(items, (item) => [item, iter(item)])
}

// Cache snub angles, since they're always the same
const snubAngles = createObject([3, 4, 5], (family: Family) => {
  const specs = Classical.query.withData({ family, operation: "snub" })
  return {
    face: calcSnubAngle(specs, "face"),
    vertex: calcSnubAngle(specs, "vertex"),
  }
})

// TODO deduplicate these (note: bevel has a different criterion for getting face)
const cantellatedDists = createObject([3, 4, 5], (family: Family) => {
  const specs = Classical.query.withData({ family, operation: "cantellate" })
  const geom = getGeometry(specs)
  const forme = ClassicalForme.create(specs, geom)
  const face = forme.facetFace("face")
  return face.distanceToCenter() / geom.edgeLength()
})

function calcTruncatedDist(family: Family, facet: Facet) {
  const _facet = family === 3 ? undefined : facet
  const specs = Classical.query.withData({
    family,
    operation: "truncate",
    facet: _facet,
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

function getSnubAngle(specs: Classical, facet: Facet) {
  const sign = specs.data.twist === "left" ? -1 : 1
  // if vertex-solid, reverse the sign
  const sign2 = facet === "vertex" ? -1 : 1
  const angle = snubAngles[specs.data.family][facet]
  return sign2 * sign * angle
}

/**
 * Get the common properties of a resize operation's pose.
 */
function getPose(geom: Polyhedron, face: Face, crossAxis: Vec3D): Pose {
  return {
    // Always centered on centroid
    origin: geom.centroid(),
    // Always scale to side length
    scale: geom.edgeLength(),
    // Use the normal of the given face as the first axis
    orientation: [face.normal(), crossAxis],
  }
}

// Get the pose of a regular solid for both expand/snub
function getRegularPose(geom: Polyhedron): Pose {
  const face = geom.getFace()
  return getPose(geom, face, apothemVec(face.edges[0]))
}

function getCantellatedPose(forme: ClassicalForme, facet: Facet): Pose {
  // Use an expanded face as the face
  const face = forme.facetFace(facet)
  // Pick one of the edges as cross axis
  return getPose(forme.geom, face, apothemVec(face.edges[0]))
}

function getSnubPose(forme: ClassicalForme, facet: Facet): Pose {
  // Use an expanded face as the face
  const face = forme.facetFace(facet)
  // Rotate the apothem vector to align it correctly
  const crossAxis = apothemVec(face.edges[0]).getRotatedAroundAxis(
    face.normal(),
    getSnubAngle(forme.specs, facet),
  )
  return getPose(forme.geom, face, crossAxis)
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
    const { geom } = forme
    if (pos === "left") {
      const face = forme.mainFacetFace()
      // FIXME see if we can move this to a Forme method?
      const edge = face.edges.find(
        (e) => e.twinFace().numSides === face.numSides,
      )!
      return getPose(geom, face, apothemVec(edge))
    } else {
      const face = forme.facetFace(facet || "face")
      const edge = face.edges.find((e) => e.twinFace().numSides === 4)!
      return getPose(geom, face, apothemVec(edge))
    }
  },
  toLeft(forme, { right: { facet = "face" } }) {
    return getResizedVertices(
      forme.facetFaces(facet),
      bevelledDists[forme.specs.data.family][facet],
    )
  },
  createForme: (specs, geom) => ClassicalForme.create(specs, geom),
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
    return pos === "left"
      ? getRegularPose(forme.geom)
      : getCantellatedPose(forme, facet)
  },
  toLeft(forme, { right: { facet } }, result) {
    // Take all the stuff and push it inwards
    return getResizedVertices(
      // FIXME get rid of the adjustment
      forme.facetFaces(facet || "vertex"),
      getInradius(result),
    )
  },
  createForme: (specs, geom) => ClassicalForme.create(specs, geom),
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

  getPose(pos, forme, { right: { facet = "face" } }) {
    return pos === "left"
      ? getRegularPose(forme.geom)
      : getSnubPose(forme, facet)
  },
  toLeft(forme, { right: { facet = "face" } }, result) {
    // Take all the stuff and push it inwards
    return getResizedVertices(
      // FIXME get rid of this side thing
      forme.facetFaces(result.data.facet || "face"),
      getInradius(result),
      getSnubAngle(forme.specs, facet),
    )
  },
  createForme: (specs, geom) => ClassicalForme.create(specs, geom),
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
    return pos === "left"
      ? getCantellatedPose(forme, "face")
      : getSnubPose(forme, "face")
  },
  toLeft(forme) {
    return getResizedVertices(
      forme.facetFaces("face"),
      cantellatedDists[forme.specs.data.family],
      getSnubAngle(forme.specs, "face"),
    )
  },
  createForme: (specs, geom) => ClassicalForme.create(specs, geom),
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
          ...getRegularPose(geom),
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
          ...getCantellatedPose(forme, "face"),
          scale: getCantellatedMidradius(forme),
        }
      }
    }
  },
  toLeft: (forme) => doDualTransform(forme, "face"),
  toRight: (forme) => doDualTransform(forme, "vertex"),
  createForme: (specs, geom) => ClassicalForme.create(specs, geom),
})

// Exported members

type ExpansionType = "cantellate" | "snub"

function expansionType(polyhedron: Polyhedron): ExpansionType {
  return polyhedron.getVertex().adjacentFaceCounts()[3] >= 3
    ? "snub"
    : "cantellate"
}

const edgeShape = {
  snub: 3,
  cantellate: 4,
}

// TODO replace with isCantellatedFace and isSnubFace
export function isExpandedFace(
  polyhedron: Polyhedron,
  face: Face,
  nSides?: number,
) {
  const type = expansionType(polyhedron)
  if (typeof nSides === "number" && face.numSides !== nSides) return false
  if (!face.isValid()) return false
  return face.adjacentFaces().every((f) => f.numSides === edgeShape[type])
}

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
export const contract = makeOperation<FacetOpts, Classical>("contract", {
  ...combineOps([_expand, _snub, semiExpand].map((op) => op.right)),

  hitOption: "facet",
  getHitOption({ specs, geom }, hitPoint) {
    const hitFace = geom.hitFace(hitPoint)
    const faceType = hitFace.numSides
    if (specs.isBevelled()) {
      const isValid = hitFace.numSides > 4
      return isValid ? { facet: faceType === 6 ? "vertex" : "face" } : {}
    }
    const isValid = isExpandedFace(geom, hitFace)
    return isValid ? { facet: faceType === 3 ? "vertex" : "face" } : {}
  },

  faceSelectionStates({ specs, geom }, { facet }) {
    if (specs.isBevelled()) {
      return geom.faces.map((face) => {
        const faceType = facet === "vertex" ? 6 : specs.data.family * 2
        if (facet && face.numSides === faceType) {
          return "selected"
        }
        if (face.numSides !== 4) return "selectable"
        return undefined
      })
    }
    const faceType = !facet ? null : facet === "vertex" ? 3 : specs.data.family
    return geom.faces.map((face) => {
      if (faceType && isExpandedFace(geom, face, faceType)) return "selected"
      if (isExpandedFace(geom, face)) return "selectable"
      return undefined
    })
  },
})
