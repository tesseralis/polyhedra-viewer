import { minBy } from "lodash-es"
import { Twist } from "types"
import { mapObject } from "utils"
import Classical, { Facet, Family } from "data/specs/Classical"
import { makeOpPair, combineOps, Pose } from "./operationPairs"
import { angleBetween, getPlane, withOrigin, Vec3D } from "math/geom"
import { Polyhedron, Face, Edge } from "math/polyhedra"
import {
  getOppTwist,
  oppositeFace,
  getTransformedVertices,
  FacetOpts,
  TwistOpts,
  getGeometry,
} from "./operationUtils"
import Operation, { makeOperation } from "./Operation"

function getSnubTetrahedronFaces(polyhedron: Polyhedron) {
  const f0 = polyhedron.faceWithNumSides(3)
  return [f0, ...f0.edges.map((e) => oppositeFace(e, "right"))]
}

function getCantellatedTetrahedronFaces(polyhedron: Polyhedron, odd?: boolean) {
  let f0 = polyhedron.faceWithNumSides(3)
  if (odd) {
    f0 = f0.edges[0].twin().next().twinFace()
  }
  return [f0, ...f0.edges.map((e) => oppositeFace(e))]
}

function getBevelledTetrahedronFaces(polyhedron: Polyhedron) {
  const f0 = polyhedron.faceWithNumSides(6)
  const rest = f0.edges
    .filter((e) => e.twinFace().numSides === 4)
    .map((e) => oppositeFace(e))
  return [f0, ...rest]
}

function getSnubFaces(specs: Classical, polyhedron: Polyhedron, facet?: Facet) {
  if (specs.isTetrahedral()) {
    return getSnubTetrahedronFaces(polyhedron)
  }
  return polyhedron.faces.filter((face) =>
    isSnubFace(face, getFaceType(specs, facet)),
  )
}

function getBevelledFaces(specs: Classical, geom: Polyhedron, facet: Facet) {
  if (specs.isTetrahedral()) {
    return getBevelledTetrahedronFaces(geom)
  }
  return geom.faces.filter((f) => f.numSides === 2 * getFaceType(specs, facet))
}

function getCantellatedFaces(
  specs: Classical,
  geom: Polyhedron,
  facet?: Facet,
  odd?: boolean,
) {
  if (specs.isTetrahedral()) {
    return getCantellatedTetrahedronFaces(geom, odd)
  }
  return geom.faces.filter((face) =>
    isCantellatedFace(face, getFaceType(specs, facet)),
  )
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

// Get the face type for the given facet and solid specs
function getFaceType(specs: Classical, facet?: Facet) {
  return facet === "vertex" ? 3 : specs.data.family
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
  const expandedFaces = getSnubFaces(specs, polyhedron, facet)
  const [face0, ...rest] = expandedFaces
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

function isCantellatedFace(face: Face, faceType: number) {
  return (
    face.numSides === faceType &&
    face.adjacentFaces().every((f) => f.numSides === 4)
  )
}

function isCantellatedEdgeFace(face: Face) {
  return (
    face.numSides === 4 && face.adjacentFaces().some((f) => f.numSides !== 4)
  )
}

export function getCantellatedEdgeFace(geom: Polyhedron) {
  const face = geom.faces.find(isCantellatedEdgeFace)
  if (!face) throw new Error(`Could not find edge face for ${geom.name}`)
  return face
}

export function getCantellatedFace(geom: Polyhedron, faceType: number) {
  const face = geom.faces.find((f) => isCantellatedFace(f, faceType))
  if (!face) throw new Error(`Could not find cantellated face for ${geom.name}`)
  return face
}

function isSnubFace(face: Face, faceType: number) {
  return (
    face.numSides === faceType &&
    face.adjacentFaces().every((f) => f.numSides === 3)
  )
}

// TODO deduplicate these (note: bevel has a different criterion for getting face)
const cantellatedDists = createObject([3, 4, 5], (family: Family) => {
  const specs = Classical.query.withData({ family, operation: "cantellate" })
  const geom = getGeometry(specs)
  const face = getCantellatedFace(geom, family)
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

function getCantellatedPose(
  geom: Polyhedron,
  specs: Classical,
  facet?: Facet,
): Pose {
  const faceType = getFaceType(specs, facet)
  // Use an expanded face as the face
  const face = getCantellatedFace(geom, faceType)
  // Pick one of the edges as cross axis
  return getPose(geom, face, apothemVec(face.edges[0]))
}

function getSnubPose(geom: Polyhedron, specs: Classical, facet: Facet): Pose {
  const faceType = getFaceType(specs, facet)
  // Use an expanded face as the face
  const face = geom.faces.find((face) => isSnubFace(face, faceType))!
  // Rotate the apothem vector to align it correctly
  const crossAxis = apothemVec(face.edges[0]).getRotatedAroundAxis(
    face.normal(),
    getSnubAngle(specs, facet),
  )
  return getPose(geom, face, crossAxis)
}

function twistOpts(specs: Classical): Twist[] {
  // Snub tetrahedra aren't chiral (yet)
  return specs.isTetrahedral() ? ["left"] : ["left", "right"]
}

// Expansion of truncated to bevelled solids
const semiExpand = makeOpPair<Classical, {}, FacetOpts>({
  graph: Classical.query
    .where((s) => s.isTruncated())
    .map((entry) => ({
      left: entry,
      right: entry.withData({ operation: "bevel" }),
      options: { left: {}, right: { facet: entry.data.facet } },
    })),
  middle: "right",
  getPose(pos, { specs, geom }, { right: { facet } }) {
    if (pos === "left") {
      const face = geom.faces.find((f) => f.numSides > 5)!
      const edge = face.edges.find(
        (e) => e.twinFace().numSides === face.numSides,
      )!
      return getPose(geom, face, apothemVec(edge))
    } else {
      const faceType = 2 * getFaceType(specs, facet)
      const face = geom.faceWithNumSides(faceType)
      const edge = face.edges.find((e) => e.twinFace().numSides === 4)!
      return getPose(geom, face, apothemVec(edge))
    }
  },
  toLeft({ specs, geom }, { right: { facet = "face" } }) {
    return getResizedVertices(
      getBevelledFaces(specs, geom, facet),
      bevelledDists[specs.data.family][facet],
    )
  },
})

const _expand = makeOpPair<Classical, {}, FacetOpts>({
  graph: Classical.query
    .where((s) => s.isRegular())
    .map((entry) => {
      return {
        left: entry,
        right: entry.withData({ operation: "cantellate" }),
        options: { left: {}, right: { facet: entry.data.facet } },
      }
    }),

  middle: "right",

  getPose(pos, { geom, specs }, { right: { facet } }) {
    return pos === "left"
      ? getRegularPose(geom)
      : getCantellatedPose(geom, specs, facet)
  },
  toLeft({ specs, geom }, { right: { facet } }, result) {
    // Take all the stuff and push it inwards
    return getResizedVertices(
      getCantellatedFaces(specs, geom, facet),
      getInradius(result),
    )
  },
})

const _snub = makeOpPair<Classical, TwistOpts, FacetOpts>({
  graph: Classical.query
    .where((s) => s.isRegular())
    .flatMap((entry) => {
      return twistOpts(entry).map((twist) => ({
        left: entry,
        right: entry.withData({
          operation: "snub",
          // If a vertex-solid, the chirality of the result
          // is *opposite* of the twist option
          twist: entry.isVertex() ? getOppTwist(twist) : twist,
        }),
        options: { left: { twist }, right: { facet: entry.data.facet } },
      }))
    }),

  middle: "right",

  getPose(pos, { geom, specs }, { right: { facet = "face" } }) {
    return pos === "left"
      ? getRegularPose(geom)
      : getSnubPose(geom, specs, facet)
  },
  toLeft({ specs, geom }, { right: { facet = "face" } }, result) {
    // Take all the stuff and push it inwards
    return getResizedVertices(
      getSnubFaces(specs, geom, result.data.facet),
      getInradius(result),
      getSnubAngle(specs, facet),
    )
  },
})

const _twist = makeOpPair<Classical, TwistOpts, {}>({
  graph: Classical.query
    .where((s) => s.isCantellated())
    .flatMap((entry) => {
      return twistOpts(entry).map((twist) => ({
        left: entry,
        right: entry.withData({ operation: "snub", twist }),
        options: { left: { twist }, right: {} },
      }))
    }),

  middle: "right",

  getPose(pos, { specs, geom }) {
    return pos === "left"
      ? getCantellatedPose(geom, specs, "face")
      : getSnubPose(geom, specs, "face")
  },
  toLeft({ specs, geom }) {
    return getResizedVertices(
      getSnubFaces(specs, geom, "face"),
      cantellatedDists[specs.data.family],
      getSnubAngle(specs, "face"),
    )
  },
})

function getCantellatedMidradius(geom: Polyhedron) {
  return getCantellatedEdgeFace(geom).distanceToCenter()
}

/**
 * Take the cantellated intermediate solid and convert it to either dual
 */
function doDualTransform(specs: Classical, geom: Polyhedron, facet: Facet) {
  const resultSpecs = specs.withData({ operation: "regular", facet })
  const resultSideLength =
    getCantellatedMidradius(geom) / getMidradius(resultSpecs)
  const scale = resultSideLength * getCircumradius(resultSpecs)
  const oppFacet = facet === "face" ? "vertex" : "face"
  const faces = getCantellatedFaces(specs, geom, oppFacet, facet === "face")
  return getTransformedVertices(faces, (f) => {
    return geom.centroid().add(f.normal().scale(scale))
  })
}

const _dual = makeOpPair({
  graph: Classical.query
    .where((s) => s.isRegular() && !s.isVertex())
    .map((specs) => ({
      left: specs,
      right: specs.withData({ facet: "vertex" }),
    })),
  middle: (entry) => entry.left.withData({ operation: "cantellate" }),
  getPose(pos, { specs, geom }) {
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
          ...getCantellatedPose(geom, specs, "face"),
          scale: getCantellatedMidradius(geom),
        }
      }
    }
  },
  toLeft: ({ specs, geom }) => doDualTransform(specs, geom, "face"),
  toRight: ({ specs, geom }) => doDualTransform(specs, geom, "vertex"),
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
