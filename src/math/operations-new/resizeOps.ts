import { minBy } from "lodash-es"
import { Twist } from "types"
import { mapObject } from "utils"
import Classical, { Facet, Family } from "data/specs/Classical"
import OperationPair, { getGeom, Pose } from "./OperationPair"
import { getPlane, withOrigin, Vec3D } from "math/geom"
import { Polyhedron, Face, Edge } from "math/polyhedra"
import { getTransformedVertices } from "../operations/operationUtils"
import { getExpandedFaces } from "./resizeUtils"
import { Plane } from "toxiclibsjs/geom"

/**
 * Return the expanded vertices of the polyhedron resized to the given distance-from-center
 * and rotated by the given angle
 *
 * @param geom the polyhedron geometry to transform
 * @param faceType the type of expanded face to act on
 * @param distance the normalized distance from center to put those faces
 * @param angle the angle to twist the faces by
 */
function getResizedVertices(
  geom: Polyhedron,
  faceType: number,
  distance: number,
  angle: number = 0,
) {
  const faces = getExpandedFaces(geom, faceType)
  const resizedLength = geom.edgeLength() * distance
  const f0 = faces[0]
  const scale = resizedLength - f0.distanceToCenter()
  return getTransformedVertices(faces, (f) =>
    withOrigin(f.centroid(), (v) =>
      v.getRotatedAroundAxis(f.normal(), angle).add(f.normal().scale(scale)),
    ),
  )
}

const coxeterNum = { 3: 4, 4: 6, 5: 10 }
function getRegularLength(family: Family, faceType: 3 | 4 | 5) {
  // Calculate dihedral angle
  // https://en.wikipedia.org/wiki/Platonic_solid#Angles
  const n = family
  const p = faceType
  const q = 3 + n - p
  const h = coxeterNum[n]
  const tanTheta2 = Math.cos(Math.PI / q) / Math.sin(Math.PI / h)

  // Calculate the inradius
  // https://en.wikipedia.org/wiki/Platonic_solid#Radii,_area,_and_volume
  return tanTheta2 / 2 / Math.tan(Math.PI / p)
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
  const polyhedron = getGeom(specs)
  const expandedFaces = getExpandedFaces(polyhedron, getFaceType(specs, facet))
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
  const normMidpoint = midpoint.sub(faceCentroid)
  const projected = plane.getProjectedPoint(midpoint).sub(faceCentroid)
  // Use `||` and not `??` because this can return NaN
  return normMidpoint.angleBetween(projected, true) || 0
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

function isSnubFace(face: Face, faceType: number) {
  return (
    face.numSides === faceType &&
    face.adjacentFaces().every((f) => f.numSides === 3)
  )
}

// TODO deduplicate these (note: bevel has a different criterion for getting face)
const cantellatedDists = createObject([3, 4, 5], (family: Family) => {
  const specs = Classical.query.withData({ family, operation: "cantellate" })
  const geom = getGeom(specs)
  const face = geom.faces.find((face) => isCantellatedFace(face, family))!
  return face.distanceToCenter() / geom.edgeLength()
})

const bevelledDists = createObject([3, 4, 5], (family: Family) => {
  const specs = Classical.query.withData({ family, operation: "bevel" })
  const geom = getGeom(specs)
  const face = geom.largestFace()
  return face.distanceToCenter() / geom.edgeLength()
})

function getSnubAngle(specs: Classical, facet: Facet) {
  const sign = specs.data.twist === "left" ? 1 : -1
  const angle = snubAngles[specs.data.family][facet]
  return sign * angle
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
  const face = geom.faces.find((face) => isCantellatedFace(face, faceType))!
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

interface ExpandOpts {
  facet?: Facet
}

// Expansion of truncated to bevelled solids
export const semiExpand = new OperationPair<Classical, ExpandOpts>({
  graph: Classical.query
    .where((data) => data.operation === "truncate")
    .map((entry) => ({
      left: entry,
      right: entry.withData({ operation: "bevel" }),
      options: { facet: entry.data.facet },
    })),
  getIntermediate: (entry) => entry.right,
  getPose(pos, { specs, geom }, { facet }) {
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
  toLeft({ specs, geom }, { facet }) {
    return getResizedVertices(
      geom,
      2 * getFaceType(specs, facet),
      bevelledDists[specs.data.family],
    )
  },
  toRight: (solid) => solid.geom.vertices,
})

export const expand = new OperationPair<Classical, ExpandOpts>({
  graph: Classical.query
    .where((data) => data.operation === "regular")
    .map((entry) => {
      return {
        left: entry,
        right: entry.withData({ operation: "cantellate" }),
        options: { facet: entry.data.facet },
      }
    }),

  getIntermediate: (entry) => entry.right,

  getPose(pos, { geom, specs }, { facet }) {
    return pos === "left"
      ? getRegularPose(geom)
      : getCantellatedPose(geom, specs, facet)
  },
  toLeft({ specs, geom }, { facet }) {
    const faceType = getFaceType(specs, facet)
    // Take all the stuff and push it inwards
    return getResizedVertices(
      geom,
      faceType,
      getRegularLength(specs.data.family, faceType),
    )
  },
  toRight: (solid) => solid.geom.vertices,
})

interface SnubOptions {
  twist?: Twist
}

function getOpp(twist: Twist) {
  return twist === "left" ? "right" : "left"
}

function facetFromTwist(specs: Classical, twist: Twist) {
  // If the twist option is in the same direction as the spec,
  // it's a face-solid. Otherwise it's a vertex solid
  return twist === specs.data.twist ? "face" : "vertex"
}

export const snub = new OperationPair<Classical, SnubOptions>({
  graph: Classical.query
    .where((data) => data.operation === "regular")
    .flatMap((entry) => {
      return twistOpts(entry).map((twist) => ({
        left: entry,
        right: entry.withData({
          operation: "snub",
          // If a vertex-solid, the chirality of the result
          // is *opposite* of the twist option
          twist: entry.isVertex() ? getOpp(twist) : twist,
        }),
        options: { twist },
      }))
    }),

  getIntermediate: (entry) => entry.right,

  getPose(pos, { geom, specs }, { twist = "left" }) {
    return pos === "left"
      ? getRegularPose(geom)
      : getSnubPose(geom, specs, facetFromTwist(specs, twist))
  },
  toLeft({ specs, geom }, { twist = "left" }) {
    const facet = facetFromTwist(specs, twist)
    const faceType = getFaceType(specs, facet)
    // Take all the stuff and push it inwards
    return getResizedVertices(
      geom,
      faceType,
      getRegularLength(specs.data.family, faceType),
      getSnubAngle(specs, facet),
    )
  },
  toRight: (solid) => solid.geom.vertices,
})

export const twist = new OperationPair<Classical, SnubOptions>({
  graph: Classical.query
    .where((data) => data.operation === "cantellate")
    .flatMap((entry) => {
      return twistOpts(entry).map((twist) => ({
        left: entry,
        right: entry.withData({ operation: "snub", twist }),
        options: { twist },
      }))
    }),

  getIntermediate: (entry) => entry.right,

  getPose(pos, { specs, geom }) {
    return pos === "left"
      ? getCantellatedPose(geom, specs, "face")
      : getSnubPose(geom, specs, "face")
  },
  toLeft({ specs, geom }) {
    return getResizedVertices(
      geom,
      specs.data.family,
      cantellatedDists[specs.data.family],
      getSnubAngle(specs, "face"),
    )
  },
  toRight: (solid) => solid.geom.vertices,
})

export const dual = new OperationPair({
  graph: Classical.query
    .where((data) => data.operation === "regular" && data.facet !== "vertex")
    .map((specs) => ({
      left: specs,
      right: specs.withData({ facet: "vertex" }),
    })),
  getIntermediate: (entry) => entry.left.withData({ operation: "cantellate" }),
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
        const plane = new Plane(vertex.vec, normal)
        return {
          origin: geom.centroid(),
          scale: geom.edges[0].distanceToCenter(),
          orientation: [
            normal,
            plane.getProjectedPoint(v2.vec).sub(vertex.vec),
          ],
        }
      }
      case "middle": {
        const edgeFace = geom.faces.find(
          (face) =>
            face.numSides === 4 &&
            face.adjacentFaces().some((f) => f.numSides !== 4),
        )!
        return {
          ...getCantellatedPose(geom, specs, "face"),
          // scale to one of the lateral faces
          scale: edgeFace.distanceToCenter(),
        }
      }
    }
  },
  toLeft({ specs, geom }) {
    const faceType = getFaceType(specs, "face")
    // Take all the stuff and push it inwards
    return getResizedVertices(
      geom,
      faceType,
      getRegularLength(specs.data.family, faceType),
    )
  },
  toRight({ specs, geom }) {
    const faceType = getFaceType(specs, "vertex")
    // Take all the stuff and push it inwards
    return getResizedVertices(
      geom,
      faceType,
      getRegularLength(specs.data.family, faceType),
    )
  },
})
