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
  CutPasteOpArgs,
  combineOps,
} from "./cutPasteUtils"
import { getTransformedVertices } from "../operationUtils"
import { makeOperation } from "../Operation"
import CapstoneForme from "math/formes/CapstoneForme"
import CompositeForme from "math/formes/CompositeForme"

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

const gyrateCapstone: CutPasteOpArgs<CapOptions, Capstone, CapstoneForme> = {
  apply({ geom }, options) {
    return applyGyrate(geom, options)
  },
  canApplyTo(info) {
    if (!info.isCapstone()) return false
    return info.isBi() && !info.isPyramid() && info.data.base > 2
  },
  getResult({ specs }) {
    return specs.withData({
      gyrate: specs.data.gyrate === "ortho" ? "gyro" : "ortho",
    })
  },
}

const gyrateComposite: CutPasteOpArgs<CapOptions, Composite, CompositeForme> = {
  apply({ geom }, options) {
    return applyGyrate(geom, options)
  },
  canApplyTo(info) {
    if (!info.isComposite()) return false
    const { source, diminished } = info.data
    // FIXME deal with gyrate rhombicuboctahedron
    if (source.canonicalName() !== "rhombicosidodecahedron") return false
    if (diminished === 2) return !info.isPara()
    return diminished < 3
  },
  getResult({ specs, geom }, { cap }) {
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
}

export const gyrate = makeOperation("gyrate", {
  ...combineOps<
    CapOptions,
    Capstone | Composite,
    CapstoneForme | CompositeForme
  >([gyrateCapstone, gyrateComposite]),
  ...capOptionArgs,
})
