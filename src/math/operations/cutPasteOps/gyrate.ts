import { withOrigin } from "math/geom"
import { Polyhedron, Cap } from "math/polyhedra"
import { mapObject } from "utils"
import Capstone from "data/specs/Capstone"
import Composite from "data/specs/Composite"
import {
  inc,
  dec,
  getCapAlignment,
  getCupolaGyrate,
  CapOptions,
  capOptionArgs,
} from "./cutPasteUtils"
import { getTransformedVertices } from "../operationUtils"
import { makeOperation } from "../Operation"

const TAU = 2 * Math.PI

export function isGyrated(cap: Cap) {
  return getCupolaGyrate(cap) === "ortho"
}

function applyGyrate(polyhedron: Polyhedron, { cap }: CapOptions) {
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

export const gyrate = makeOperation<{ cap: Cap }, Capstone | Composite>(
  "gyrate",
  {
    apply({ geom }, options) {
      return applyGyrate(geom, options)
    },

    canApplyTo(info) {
      if (info.isCapstone()) {
        return info.isBi() && !info.isPyramid() && info.data.base > 2
      }
      if (info.isComposite()) {
        const { source, diminished } = info.data
        if (source.canonicalName() !== "rhombicosidodecahedron") return false
        if (diminished === 2) return !info.isPara()
        return diminished < 3
      }
      return false
    },

    getResult({ specs, geom }, { cap }) {
      if (specs.isCapstone()) {
        const { gyrate } = specs.data
        return specs.withData({ gyrate: gyrate === "ortho" ? "gyro" : "ortho" })
      }
      const { gyrate } = specs.data
      if (isGyrated(cap)) {
        return specs.withData({ gyrate: dec(gyrate), align: "meta" })
      } else {
        return specs.withData({
          gyrate: inc(gyrate),
          align: specs.isMono() ? getCapAlignment(geom, cap) : undefined,
        })
      }
    },

    ...capOptionArgs,
  },
)
