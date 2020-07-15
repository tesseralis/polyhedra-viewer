import { minBy } from "lodash-es"
import { Twist } from "types"
import Classical, { Facet, Family } from "data/specs/Classical"
import OperationPair, { Pose } from "./OperationPair"
import { getPlane } from "math/geom"
import { Polyhedron } from "math/polyhedra"
import {
  getResizedVertices,
  getExpandedFaces,
  isExpandedFace,
} from "./resizeUtils"

const coxeterNum = { 3: 4, 4: 6, 5: 10 }

function getContractLength(
  family: Family,
  polyhedron: Polyhedron,
  faceType: 3 | 4 | 5,
) {
  // Calculate dihedral angle
  // https://en.wikipedia.org/wiki/Platonic_solid#Angles
  const n = family
  const s = polyhedron.edgeLength()
  const p = faceType
  const q = 3 + n - p
  const h = coxeterNum[n]
  const tanTheta2 = Math.cos(Math.PI / q) / Math.sin(Math.PI / h)

  // Calculate the inradius
  // https://en.wikipedia.org/wiki/Platonic_solid#Radii,_area,_and_volume
  return (s / 2 / Math.tan(Math.PI / p)) * tanTheta2
}

// Get the face type for the given facet and solid specs
function getFaceType(specs: Classical, facet?: Facet) {
  return facet === "vertex" ? 3 : specs.data.family
}

/**
 * Return the snub angle of the given polyhedron, given the list of expanded faces
 */
export function calcSnubAngle(specs: Classical, facet: Facet) {
  // Choose one of the expanded faces and get its properties
  const polyhedron = Polyhedron.get(specs.canonicalName())
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

function snubAnglesFromFamily(family: Family) {
  const specs = Classical.query.withData({ family, operation: "snub" })
  return {
    face: calcSnubAngle(specs, "face"),
    vertex: calcSnubAngle(specs, "vertex"),
  }
}

// Cache snub angles, since they're always the same
const snubAngles = {
  3: snubAnglesFromFamily(3),
  4: snubAnglesFromFamily(4),
  5: snubAnglesFromFamily(5),
}

function getCantellatedDistance(family: Family) {
  const specs = Classical.query.withData({ family, operation: "cantellate" })
  const geom = Polyhedron.get(specs.canonicalName())
  const referenceFace =
    geom.faces.find((face) => isExpandedFace(geom, face, family)) ??
    geom.getFace()
  return referenceFace.distanceToCenter() / geom.edgeLength()
}

const cantellatedDistances = {
  3: getCantellatedDistance(3),
  4: getCantellatedDistance(4),
  5: getCantellatedDistance(5),
}

function getSnubAngle(specs: Classical, facet: Facet) {
  const sign = specs.data.twist === "left" ? 1 : -1
  const angle = snubAngles[specs.data.family][facet]
  return sign * angle
}

// Get the pose of a regular solid for both expand/snub
function getRegularPose(geom: Polyhedron): Pose {
  const face = geom.getFace()
  const crossAxis = face.edges[0].midpoint().sub(face.centroid())
  return {
    origin: geom.centroid(),
    scale: face.sideLength(),
    orientation: [face.normal(), crossAxis],
  }
}

function getCantellatedPose(
  geom: Polyhedron,
  specs: Classical,
  facet?: Facet,
): Pose {
  const faceType = getFaceType(specs, facet)
  // depends on the face type given in options
  const face = geom.faces.find(
    (face) =>
      face.numSides === faceType &&
      face.adjacentFaces().every((f) => f.numSides === 4),
  )!
  const crossAxis = face.edges[0].midpoint().sub(face.centroid())
  return {
    origin: geom.centroid(),
    scale: face.sideLength(),
    orientation: [face.normal(), crossAxis],
  }
}

function getSnubPose(geom: Polyhedron, specs: Classical, facet: Facet): Pose {
  const faceType = getFaceType(specs, facet)
  // depends on the face type given in options
  const face = geom.faces.find(
    (face) =>
      face.numSides === faceType &&
      face.adjacentFaces().every((f) => f.numSides === 3),
  )!
  const crossAxis = face.edges[0].midpoint().sub(face.centroid())
  return {
    origin: geom.centroid(),
    scale: face.sideLength(),
    orientation: [
      face.normal(),
      crossAxis.getRotatedAroundAxis(face.normal(), getSnubAngle(specs, facet)),
    ],
  }
}

/**
 * Get the geometry for the given specs with the right chirality.
 */
function getChiralGeom(specs: Classical) {
  const geom = Polyhedron.get(specs.canonicalName())
  // The reference models are always right-handed,
  // so flip 'em if not
  // TODO don't rely on this and make it more general
  return specs.data.twist === "left" ? geom.reflect() : geom
}

interface ExpandOpts {
  facet?: Facet
}

// Expansion of truncated to bevelled solids
export const semiExpand = new OperationPair<Classical, ExpandOpts>({
  graph: Classical.query
    .where((data) => data.operation === "truncate")
    .map((entry) => ({
      source: entry,
      target: entry.withData({ operation: "bevel" }),
      options: { facet: entry.data.facet },
    })),
  getIntermediate({ target }) {
    return { specs: target, geom: Polyhedron.get(target.canonicalName()) }
  },
  getPose({ specs, geom }, { facet }) {
    const origin = geom.centroid()
    if (specs.isTruncated()) {
      const face = geom.faces.find((f) => f.numSides > 5)!
      const edge = face.edges.find(
        (e) => e.twinFace().numSides === face.numSides,
      )!
      return {
        origin,
        scale: face.sideLength(),
        orientation: [face.normal(), edge.midpoint().sub(face.centroid())],
      }
    } else {
      const faceType = facet === "vertex" ? 6 : 2 * specs.data.family
      const face = geom.faceWithNumSides(faceType)
      const edge = face.edges.find((e) => e.twinFace().numSides === 4)!
      return {
        origin,
        scale: face.sideLength(),
        orientation: [face.normal(), edge.midpoint().sub(face.centroid())],
      }
    }
  },
  toStart({ specs, geom }, { facet }) {
    const reference = Polyhedron.get(
      specs.withData({ operation: "truncate", facet }).canonicalName(),
    )
    const faceType = 2 * getFaceType(specs, facet)
    // FIXME we can cache these values too
    const referenceFace = reference.faceWithNumSides(faceType)
    const resultLength =
      (referenceFace.distanceToCenter() / reference.edgeLength()) *
      geom.edgeLength()
    // Take all the stuff and push it inwards
    const contractFaces = getExpandedFaces(geom, faceType)
    return getResizedVertices(contractFaces, resultLength, 0)
  },
  toEnd({ geom }) {
    return geom.vertices
  },
})

export const expand = new OperationPair<Classical, ExpandOpts>({
  graph: Classical.query
    .where((data) => data.operation === "regular")
    .map((entry) => {
      return {
        source: entry,
        target: entry.withData({ operation: "cantellate" }),
        options: { facet: entry.data.facet },
      }
    }),
  getIntermediate({ target }) {
    return { specs: target, geom: Polyhedron.get(target.canonicalName()) }
  },
  getPose({ geom, specs }, { facet }) {
    if (specs.isRegular()) {
      return getRegularPose(geom)
    }
    if (specs.isCantellated()) {
      return getCantellatedPose(geom, specs, facet)
    }
    // FIXME handle expanding truncated solids
    throw new Error(`Cannot find pose`)
  },
  toStart({ specs, geom }, { facet }) {
    const faceType = getFaceType(specs, facet)
    const resultLength = getContractLength(specs.data.family, geom, faceType)
    // Take all the stuff and push it inwards
    const contractFaces = getExpandedFaces(geom, faceType)
    return getResizedVertices(contractFaces, resultLength)
  },
  toEnd({ geom }) {
    return geom.vertices
  },
})

interface SnubOptions {
  twist?: Twist
}

function getOpp(twist: Twist) {
  return twist === "left" ? "right" : "left"
}

export const snub = new OperationPair<Classical, SnubOptions>({
  graph: Classical.query
    .where((data) => data.operation === "regular")
    .flatMap((entry) => {
      // Snub tetrahedra aren't chiral (yet)
      const options: Twist[] = entry.isTetrahedral()
        ? ["left"]
        : ["left", "right"]
      return options.map((twist) => ({
        source: entry,
        target: entry.withData({
          operation: "snub",
          // If a vertex-solid, the chirality of the result
          // is *opposite* of the twist option
          twist: entry.isVertex() ? getOpp(twist) : twist,
        }),
        options: { twist },
      }))
    }),
  getIntermediate({ target }) {
    return { specs: target, geom: getChiralGeom(target) }
  },
  getTargetGeom(specs) {
    return getChiralGeom(specs)
  },
  getPose({ geom, specs }, { twist }) {
    if (specs.isRegular()) {
      return getRegularPose(geom)
    }
    if (specs.isSnub()) {
      // If the twist option is in the same direction as the spec,
      // it's a face-solid. Otherwise it's a vertex solid
      const facet = specs.data.twist === twist ? "face" : "vertex"
      return getSnubPose(geom, specs, facet)
    }
    // FIXME handle expanding truncated solids
    throw new Error(`Cannot find pose`)
  },
  toStart({ specs, geom }, { twist = "left" }) {
    const facet = twist === specs.data.twist ? "face" : "vertex"
    const faceType = getFaceType(specs, facet)
    const resultLength = getContractLength(specs.data.family, geom, faceType)
    // Take all the stuff and push it inwards
    const contractFaces = getExpandedFaces(geom, faceType)
    return getResizedVertices(
      contractFaces,
      resultLength,
      getSnubAngle(specs, facet),
    )
  },
  toEnd({ geom }) {
    return geom.vertices
  },
})

export const twist = new OperationPair<Classical, SnubOptions>({
  graph: Classical.query
    .where((data) => data.operation === "cantellate")
    .flatMap((source) => {
      const options: Twist[] = source.isTetrahedral()
        ? ["left"]
        : ["left", "right"]
      return options.map((twist) => ({
        source,
        target: source.withData({ operation: "snub", twist }),
        options: { twist },
      }))
    }),
  getIntermediate({ target }) {
    return { specs: target, geom: getChiralGeom(target) }
  },
  getTargetGeom(specs) {
    return getChiralGeom(specs)
  },
  getPose({ specs, geom }) {
    if (specs.isCantellated()) {
      // We always want a face facet as the top for a twist
      return getCantellatedPose(geom, specs, "face")
    } else {
      return getSnubPose(geom, specs, "face")
    }
  },
  toStart({ specs, geom }) {
    const twistFaces = getExpandedFaces(geom, specs.data.family)

    const referenceLength =
      cantellatedDistances[specs.data.family] * geom.edgeLength()

    return getResizedVertices(
      twistFaces,
      referenceLength,
      getSnubAngle(specs, "face"),
    )
  },
  toEnd({ geom }) {
    return geom.vertices
  },
})
