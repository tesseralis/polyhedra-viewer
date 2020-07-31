import { withOrigin } from "math/geom"
import { Polyhedron } from "math/polyhedra"
import { mapObject } from "utils"
import {
  CapOptions,
  capOptionArgs,
  CutPasteOpArgs,
  combineOps,
  gyrateCapstoneGraph,
  gyrateCompositeGraph,
} from "./cutPasteUtils"
import { getTransformedVertices } from "../operationUtils"
import { makeOperation } from "../Operation"
import CapstoneForme from "math/formes/CapstoneForme"
import CompositeForme, { GyrateSolidForme } from "math/formes/CompositeForme"
import { toDirected } from "../operationPairs"

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
  graph: toDirected("left", gyrateCapstoneGraph),
  toGraphOpts(forme, opts) {
    return opts as any
  },
  apply({ geom }, options) {
    return applyGyrate(geom, options)
  },
}

const gyrateComposite: CutPasteOpArgs<CapOptions, GyrateSolidForme> = {
  graph: toDirected("left", gyrateCompositeGraph),
  toGraphOpts(forme, opts) {
    // FIXME handle alignment and direction
    return opts as any
  },
  apply({ geom }, options) {
    return applyGyrate(geom, options)
  },
}

export const gyrate = makeOperation("gyrate", {
  ...combineOps<CapOptions, CapstoneForme | CompositeForme>([
    gyrateCapstone,
    gyrateComposite,
  ]),
  ...capOptionArgs,
})
