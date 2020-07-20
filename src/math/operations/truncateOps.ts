import { sum, findKey } from "lodash-es"
import { Polyhedron, Face } from "math/polyhedra"
import Classical, { Operation as OpName, Facet } from "data/specs/Classical"
import { makeOpPair, combineOps, Pose } from "./operationPairs"
import Operation, { OpArgs } from "./Operation"
import {
  getGeometry,
  FacetOpts,
  getTransformedVertices,
} from "./operationUtils"
// FIXME move this to a util
import { getCantellatedFace } from "./resizeOps"

function getSharpenFaces(polyhedron: Polyhedron) {
  const faceType = polyhedron.smallestFace().numSides
  return polyhedron.faces.filter((f) => f.numSides === faceType)
}

function getSharpenDist(face: Face) {
  const theta = Math.PI - face.edges[0].dihedralAngle()
  return face.apothem() * Math.tan(theta)
}

function getVertexToAdd(face: Face) {
  const dist = getSharpenDist(face)
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
    faces = [
      geom.faceWithNumSides(3),
      getCantellatedFace(geom, specs.data.family),
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
function truncToReg(geom: Polyhedron) {
  const sharpenFaces = getSharpenFaces(geom)
  const verticesToAdd = sharpenFaces.map((face) => getVertexToAdd(face))
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

interface Trio<L, M = L, R = M> {
  left: L
  middle: M
  right: R
}

interface TruncateTrioArgs<L, M, R> {
  operations: Trio<L, M, R>
  poses: Trio<(...args: any[]) => Pose>
  transformers: Omit<Trio<(...args: any[]) => any[]>, "middle">
  options?: Partial<Omit<Trio<(entry: Classical) => any>, "middle">>
}

function makeTruncateTrio<L extends OpName, M extends OpName, R extends OpName>(
  args: TruncateTrioArgs<L, M, R>,
) {
  interface Inputs {
    left: L | M
    right: M | R
  }
  const { operations, poses, transformers, options } = args
  const { left: leftOp, middle: middleOp, right: rightOp } = operations
  function _makeTruncateOpPair(args: Inputs) {
    const { left, right } = args
    return makeOpPair({
      graph: Classical.query
        .where((s) => s.data.operation === middleOp)
        .map((entry) => {
          return {
            left: entry.withData({ operation: left }),
            right: entry.withData({ operation: right }),
            options: {
              left: options?.left?.(entry),
              right: options?.right?.(entry),
            },
          }
        }),
      // The "middle" data is always going to be the truncated polyhedron
      middle:
        (findKey(args, middleOp) as "left" | "right" | undefined) ??
        ((entry: any) => entry.left.withData({ operation: middleOp })),
      getPose: ($, { geom, specs }, options) => {
        const side = findKey(operations, (val) => val === specs.data.operation)!
        const poseFn = (poses as any)[side]
        return poseFn(side, { geom, specs }, options)
      },
      toLeft: left === leftOp ? transformers.left : undefined,
      toRight: right === rightOp ? transformers.right : undefined,
    })
  }

  return {
    truncate: _makeTruncateOpPair({ left: leftOp, right: middleOp }),
    cotruncate: _makeTruncateOpPair({ left: middleOp, right: rightOp }),
    rectify: _makeTruncateOpPair({ left: leftOp, right: rightOp }),
  }
}

const ambos = makeTruncateTrio({
  operations: {
    left: "rectify",
    middle: "bevel",
    right: "cantellate",
  },
  poses: {
    left(side, { geom, specs }) {
      const origin = geom.centroid()
      const face = geom.faceWithNumSides(specs.data.family)
      const crossAxis = face.edges[0].midpoint().sub(face.centroid())
      return {
        origin,
        scale: getAvgInradius(specs, geom),
        orientation: [face.normal(), crossAxis],
      }
    },
    middle(side, { geom, specs }) {
      const origin = geom.centroid()
      const face = geom.faceWithNumSides(specs.data.family * 2)
      const edge = face.edges.find((e: any) => e.twinFace().numSides !== 4)!
      const crossAxis = edge.midpoint().sub(face.centroid())
      return {
        origin,
        scale: getAvgInradius(specs, geom),
        orientation: [face.normal(), crossAxis],
      }
    },
    right(side, { geom, specs }) {
      const origin = geom.centroid()
      const face = getCantellatedFace(geom, specs.data.family)
      const crossAxis = face.vertices[0].vec.sub(face.centroid())
      return {
        origin,
        scale: getAvgInradius(specs, geom),
        orientation: [face.normal(), crossAxis],
      }
    },
  },
  transformers: {
    left: ({ geom, specs }, $, result) => bevToRect(specs, geom, result),
    right: ({ geom, specs }, $, result) => bevToCant(specs, geom, result),
  },
})

const regs = makeTruncateTrio({
  operations: {
    left: "regular",
    middle: "truncate",
    right: "rectify",
  },
  options: {
    right: (entry) => ({ facet: entry.data.facet }),
  },
  poses: {
    left($, { geom }) {
      return regularPose(geom)
    },
    middle($, { geom }) {
      return truncatedPose(geom)
    },
    right($, { specs, geom }, options) {
      return rectifiedPose(specs, geom, options?.right?.facet)
    },
  },
  transformers: {
    left: ({ geom }) => truncToReg(geom),
    right: ({ geom }) => truncToRect(geom),
  },
})

// Exported operations

export const truncate = new Operation(
  "truncate",
  combineOps([regs.truncate.left, ambos.truncate.left]),
)

export const cotruncate = new Operation(
  "cotruncate",
  combineOps([regs.cotruncate.left, ambos.cotruncate.left]),
)

export const rectify = new Operation(
  "rectify",
  combineOps([regs.rectify.left, ambos.rectify.left]),
)

export const sharpen = new Operation(
  "sharpen",
  combineOps([regs.truncate.right, ambos.truncate.right]),
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
    regs.cotruncate.right,
    ambos.cotruncate.right,
  ]),
  ...hitOptArgs,
})

export const unrectify = new Operation("unrectify", {
  ...combineOps<Classical, FacetOpts>([
    regs.rectify.right,
    ambos.rectify.right,
  ]),
  ...hitOptArgs,
})
