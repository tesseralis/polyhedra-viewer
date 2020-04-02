import { withOrigin } from "math/geom"
import { Polyhedron, Cap } from "math/polyhedra"
import { mapObject } from "utils"
import { getCapAlignment, getCupolaGyrate } from "./cutPasteUtils"
import { getTransformedVertices } from "../operationUtils"
import makeOperation from "../makeOperation"

const TAU = 2 * Math.PI

interface Options {
  cap: Cap
}

export function isGyrated(cap: Cap) {
  return getCupolaGyrate(cap) === "ortho"
}

function applyGyrate(polyhedron: Polyhedron, { cap }: Options) {
  // get adjacent faces
  const boundary = cap.boundary()

  // rotate the cupola/rotunda top
  const theta = TAU / boundary.numSides

  const oldToNew = mapObject(boundary.vertices, (vertex, i) => [
    vertex.index,
    i,
  ])

  const mockPolyhedron = polyhedron.withChanges((solid) =>
    solid.addVertices(boundary.vertices).mapFaces((face) => {
      if (face.inSet(cap.faces())) {
        return face
      }
      return face.vertices.map((v) => {
        return v.inSet(boundary.vertices)
          ? polyhedron.numVertices() + oldToNew[v.index]
          : v.index
      })
    }),
  )

  const endVertices = getTransformedVertices(
    [cap],
    (p) =>
      withOrigin(p.normalRay(), (v) =>
        v.getRotatedAroundAxis(p.normal(), theta),
      ),
    mockPolyhedron.vertices,
  )

  // TODO the animation makes the cupola shrink and expand.
  // Make it not do that.
  return {
    animationData: {
      start: mockPolyhedron,
      endVertices,
    },
  }
}

export const gyrate = makeOperation("gyrate", {
  apply: applyGyrate,
  optionTypes: ["cap"],

  canApplyTo(info) {
    if (info.isCapstone()) {
      return info.isBi() && !info.isPyramid() && info.data.base > 2
    }
    if (info.isComposite()) {
      const { source, diminished } = info.data
      return (
        source.canonicalName() === "rhombicosidodecahedron" && diminished < 3
      )
    }
    return false
  },

  getResult(info, { cap }, polyhedron) {
    if (info.isCapstone()) {
      const { gyrate } = info.data
      return info.withData({ gyrate: gyrate === "ortho" ? "gyro" : "ortho" })
    }
    if (info.isComposite()) {
      const { gyrate } = info.data
      if (isGyrated(cap)) {
        return info.withData({
          gyrate: (gyrate - 1) as any,
          align: "meta",
        })
      } else {
        return info.withData({
          gyrate: (gyrate + 1) as any,
          align: info.isMono() ? getCapAlignment(polyhedron, cap) : undefined,
        })
      }
    }
    throw new Error()
  },

  hasOptions() {
    return true
  },

  *allOptionCombos(info, polyhedron) {
    for (const cap of Cap.getAll(polyhedron)) yield { cap }
  },

  hitOption: "cap",
  getHitOption(polyhedron, hitPnt) {
    const cap = Cap.find(polyhedron, hitPnt)
    return cap ? { cap } : {}
  },

  faceSelectionStates(polyhedron, { cap }) {
    const allCapFaces = Cap.getAll(polyhedron).flatMap((cap) => cap.faces())
    return polyhedron.faces.map((face) => {
      if (cap instanceof Cap && face.inSet(cap.faces())) return "selected"
      if (face.inSet(allCapFaces)) return "selectable"
      return undefined
    })
  },
})
