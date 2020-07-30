import { withOrigin } from "math/geom"
import { Polyhedron } from "math/polyhedra"
import { mapObject } from "utils"
import {
  inc,
  dec,
  CapOptions,
  capOptionArgs,
  CutPasteOpArgs,
  combineOps,
} from "./cutPasteUtils"
import { getTransformedVertices } from "../operationUtils"
import { makeOperation } from "../Operation"
import CapstoneForme from "math/formes/CapstoneForme"
import CompositeForme, { GyrateSolidForme } from "math/formes/CompositeForme"

const TAU = 2 * Math.PI

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

const gyrateCapstone: CutPasteOpArgs<CapOptions, CapstoneForme> = {
  apply({ geom }, options) {
    return applyGyrate(geom, options)
  },
  canApplyTo(info) {
    if (!info.isCapstone()) return false
    return info.isBi() && info.isSecondary() && !info.isDigonal()
  },
  getResult({ specs }) {
    return specs.withData({
      gyrate: specs.data.gyrate === "ortho" ? "gyro" : "ortho",
    })
  },
}

const gyrateComposite: CutPasteOpArgs<CapOptions, GyrateSolidForme> = {
  apply({ geom }, options) {
    return applyGyrate(geom, options)
  },
  canApplyTo(info) {
    if (!info.isComposite()) return false
    if (!info.isGyrateSolid()) return false
    // FIXME deal with gyrate rhombicuboctahedron
    const { diminished } = info.data
    if (diminished === 2) return !info.isPara()
    return diminished < 3
  },
  getResult(forme, { cap }) {
    const { specs } = forme
    const { gyrate } = specs.data
    if (forme.isGyrate(cap)) {
      return specs.withData({ gyrate: dec(gyrate), align: "meta" })
    } else {
      return specs.withData({
        gyrate: inc(gyrate),
        align: specs.isMono() ? forme.alignment(cap) : undefined,
      })
    }
  },
}

export const gyrate = makeOperation("gyrate", {
  ...combineOps<CapOptions, CapstoneForme | CompositeForme>([
    gyrateCapstone,
    gyrateComposite,
  ]),
  ...capOptionArgs,
})
