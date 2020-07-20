import { sum, meanBy, findKey } from "lodash-es"
import { Polyhedron, Face, Edge } from "math/polyhedra"
import Classical, { Facet } from "data/specs/Classical"
import { makeOpPair, combineOps, Pose } from "./operationPairs"
import Operation, { OpArgs } from "./Operation"
import {
  getGeometry,
  FacetOpts,
  getTransformedVertices,
} from "./operationUtils"

function getSharpenFaces(polyhedron: Polyhedron) {
  const faceType = polyhedron.smallestFace().numSides
  return polyhedron.faces.filter((f) => f.numSides === faceType)
}

function calculateSharpenDist(face: Face, edge: Edge) {
  const apothem = face.apothem()
  const theta = Math.PI - edge.dihedralAngle()
  return apothem * Math.tan(theta)
}

function getSharpenDist(info: Classical, face: Face) {
  if (info.isBevelled()) {
    return meanBy(face.edges, (edge) => calculateSharpenDist(face, edge))
  }
  return calculateSharpenDist(face, face.edges[0])
}

function getVertexToAdd(info: Classical, face: Face) {
  const dist = getSharpenDist(info, face)
  return face.normalRay().getPointAtDistance(dist)
}

function getAvgInradius(specs: Classical, geom: Polyhedron) {
  let faces: Face[]
  if (specs.isRectified()) {
    faces = [geom.faceWithNumSides(3), geom.faceWithNumSides(specs.data.family)]
  } else if (specs.isBevelled()) {
    faces = [
      geom.faceWithNumSides(6),
      geom.faceWithNumSides(2 * specs.data.family),
    ]
  } else if (specs.isCantellated()) {
    // FIXME use isCantellatedFace from resizeOps
    faces = [
      geom.faceWithNumSides(3),
      geom.faces.find(
        (f) =>
          f.numSides === specs.data.family &&
          f.adjacentFaces().every((f) => f.numSides === 4),
      )!,
    ]
  } else {
    throw new Error(`Invalid specs: ${specs.name()}`)
  }
  return sum(faces.map((f) => f.distanceToCenter())) / faces.length
}

function regularPose(geom: Polyhedron): Pose {
  const origin = geom.centroid()
  const face = geom.getFace()
  const crossAxis = face.edges[0].midpoint().sub(face.centroid())
  return {
    origin,
    scale: face.distanceToCenter(),
    orientation: [face.normal(), crossAxis],
  }
}

function truncatedPose(geom: Polyhedron): Pose {
  const origin = geom.centroid()
  const face = geom.largestFace()
  const n = face.numSides
  const edge = face.edges.find((e) => e.twinFace().numSides === n)!
  const crossAxis = edge.midpoint().sub(face.centroid())
  return {
    origin,
    scale: face.distanceToCenter(),
    orientation: [face.normal(), crossAxis],
  }
}

function rectifiedPose(
  specs: Classical,
  geom: Polyhedron,
  facet?: Facet,
): Pose {
  const origin = geom.centroid()
  // pick a face that *isn't* the sharpen face type
  const faceType = facet === "vertex" ? 3 : specs.data.family
  const face = geom.faces.find((face) => face.numSides === faceType)!
  const crossAxis = face.vertices[0].vec.sub(face.centroid())
  return {
    origin,
    // scale with respect to the sharpen face
    scale: face.distanceToCenter(),
    orientation: [face.normal(), crossAxis],
  }
}

// Get the regular face of a truncated solid
function truncToReg(specs: Classical, geom: Polyhedron) {
  const sharpenFaces = getSharpenFaces(geom)
  const verticesToAdd = sharpenFaces.map((face) => getVertexToAdd(specs, face))
  const oldToNew: Record<number, number> = {}
  sharpenFaces.forEach((face, i) => {
    face.vertices.forEach((v) => {
      oldToNew[v.index] = i
    })
  })
  return geom.vertices.map(
    (v, vIndex) => verticesToAdd[oldToNew[vIndex]] ?? v.vec,
  )
}

function truncToRect(geom: Polyhedron) {
  const edges = geom.edges.filter(
    (e) => e.face.numSides > 5 && e.twinFace().numSides > 5,
  )
  return getTransformedVertices(edges, (e) => e.midpoint())
}

interface AmboTruncateOpPairInputs {
  left: "rectify" | "bevel"
  right: "bevel" | "cantellate"
}

function bevToRect(specs: Classical, geom: Polyhedron, resultSpec: Classical) {
  const ref = getGeometry(resultSpec)
  const refInradius = getAvgInradius(resultSpec, ref)
  const refCircumradius = ref.getVertex().distanceToCenter()
  const inradius = getAvgInradius(specs, geom)
  const faces = geom.faces.filter((f) => f.numSides === 4)
  return getTransformedVertices(faces, (f) => {
    return geom
      .centroid()
      .add(f.normal().scale((refCircumradius / refInradius) * inradius))
  })
}

function bevToCant(specs: Classical, geom: Polyhedron, resultSpec: Classical) {
  const ref = getGeometry(resultSpec)
  const refInradius = getAvgInradius(resultSpec, ref)
  const refFace = ref.faces.find(
    (f) => f.numSides === 4 && f.adjacentFaces().some((f) => f.numSides !== 4),
  )!
  const refMidradius = refFace.distanceToCenter()
  const refFaceRadius = refFace.vertices[0].vec.distanceTo(refFace.centroid())
  const inradius = getAvgInradius(specs, geom)
  const scale = inradius / refInradius
  const faces = geom.faces.filter((f) => f.numSides === 4)
  return getTransformedVertices(faces, (f) => {
    const faceCentroid = geom
      .centroid()
      .add(f.normal().scale(refMidradius * scale))

    return (v) => {
      return faceCentroid.add(
        v
          .sub(f.centroid())
          .getNormalized()
          .scale(refFaceRadius * scale),
      )
    }
  })
}

function makeAmboTruncateOpPair(args: AmboTruncateOpPairInputs) {
  const { left, right } = args
  return makeOpPair({
    graph: Classical.query
      .where((s) => s.isBevelled())
      .map((entry) => {
        return {
          left: entry.withData({ operation: left }),
          right: entry.withData({ operation: right }),
        }
      }),
    // The "middle" data is always going to be the truncated polyhedron
    middle:
      (findKey(args, "bevel") as "left" | "right" | undefined) ??
      ((entry: any) => entry.left.withData({ operation: "bevel" })),
    getPose: (side, { geom, specs }, options) => {
      const origin = geom.centroid()
      switch (specs.data.operation) {
        case "rectify": {
          const face = geom.faceWithNumSides(specs.data.family)
          const crossAxis = face.edges[0].midpoint().sub(face.centroid())
          return {
            origin,
            scale: getAvgInradius(specs, geom),
            orientation: [face.normal(), crossAxis],
          }
        }
        case "bevel": {
          const face = geom.faceWithNumSides(specs.data.family * 2)
          const edge = face.edges.find((e) => e.twinFace().numSides !== 4)!
          const crossAxis = edge.midpoint().sub(face.centroid())
          return {
            origin,
            scale: getAvgInradius(specs, geom),
            orientation: [face.normal(), crossAxis],
          }
        }
        case "cantellate": {
          const face = geom.faces.find(
            (f) =>
              f.numSides === specs.data.family &&
              f.adjacentFaces().every((f) => f.numSides === 4),
          )!
          const crossAxis = face.vertices[0].vec.sub(face.centroid())
          return {
            origin,
            scale: getAvgInradius(specs, geom),
            orientation: [face.normal(), crossAxis],
          }
        }
      }
      throw new Error(`Unknown operation: ${specs.data.operation}`)
    },
    toLeft:
      left === "rectify"
        ? ({ geom, specs }, $, result) => bevToRect(specs, geom, result)
        : undefined,
    toRight:
      right === "cantellate"
        ? ({ geom, specs }, $, result) => bevToCant(specs, geom, result)
        : undefined,
  })
}

const amboTruncate = makeAmboTruncateOpPair({ left: "rectify", right: "bevel" })
const amboCotruncate = makeAmboTruncateOpPair({
  left: "bevel",
  right: "cantellate",
})
const amboRectify = makeAmboTruncateOpPair({
  left: "rectify",
  right: "cantellate",
})

interface TruncateOpPairInputs {
  left: "regular" | "truncate"
  right: "truncate" | "rectify"
}

function makeTruncateOpPair(args: TruncateOpPairInputs) {
  const { left, right } = args
  return makeOpPair({
    graph: Classical.query
      .where((s) => s.isTruncated())
      .map((entry) => {
        return {
          left: entry.withData({ operation: left }),
          right: entry.withData({ operation: right }),
          options:
            right === "rectify"
              ? { left: {}, right: { facet: entry.data.facet } }
              : undefined,
        }
      }),
    // The "middle" data is always going to be the truncated polyhedron
    middle:
      (findKey(args, "truncate") as "left" | "right" | undefined) ??
      ((entry: any) => entry.left.withData({ operation: "truncate" })),
    getPose: (side, { geom, specs }, options) => {
      switch (specs.data.operation) {
        case "regular":
          return regularPose(geom)
        case "truncate":
          return truncatedPose(geom)
        case "rectify":
          return rectifiedPose(specs, geom, options?.right?.facet)
      }
      throw new Error(`Unknown operation: ${specs.data.operation}`)
    },
    toLeft:
      left === "regular"
        ? ({ geom, specs }) => truncToReg(specs, geom)
        : undefined,
    toRight: right === "rectify" ? ({ geom }) => truncToRect(geom) : undefined,
  })
}

const _truncate = makeTruncateOpPair({ left: "regular", right: "truncate" })
const _cotruncate = makeTruncateOpPair({ left: "truncate", right: "rectify" })
const _rectify = makeTruncateOpPair({ left: "regular", right: "rectify" })

// Exported operations

export const truncate = new Operation(
  "truncate",
  combineOps([_truncate.left, amboTruncate.left]),
)

export const cotruncate = new Operation(
  "cotruncate",
  combineOps([_cotruncate.left, amboCotruncate.left]),
)

export const rectify = new Operation(
  "rectify",
  combineOps([_rectify.left, amboRectify.left]),
)

export const sharpen = new Operation(
  "sharpen",
  combineOps([_truncate.right, amboTruncate.right]),
)

const hitOptArgs: Partial<OpArgs<FacetOpts, Classical>> = {
  hitOption: "facet",
  getHitOption({ geom }, hitPoint) {
    const n = geom.hitFace(hitPoint).numSides
    return n <= 5 ? { facet: n === 3 ? "face" : "vertex" } : {}
  },

  faceSelectionStates({ specs, geom }, { facet }) {
    const faceType = !facet ? null : facet === "face" ? 3 : specs.data.family
    return geom.faces.map((face) => {
      if (face.numSides === faceType) return "selected"
      return "selectable"
    })
  },
}

export const cosharpen = new Operation("cosharpen", {
  ...combineOps<Classical, FacetOpts>([
    _cotruncate.right,
    amboCotruncate.right,
  ]),
  ...hitOptArgs,
})

export const unrectify = new Operation("unrectify", {
  ...combineOps<Classical, FacetOpts>([_rectify.right, amboRectify.right]),
  ...hitOptArgs,
})
