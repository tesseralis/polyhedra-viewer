import { range } from "lodash-es"

import Elementary from "data/specs/Elementary"
import { mapObject } from "utils"
import {
  getTransformedVertices,
  removeExtraneousVertices,
} from "../operationUtils"
import { makeOperation } from "../Operation"
import { Polyhedron, Cap } from "math/polyhedra"
import {
  CutPasteSpecs,
  CapOptions,
  capOptionArgs,
  CutPasteOpArgs,
  combineOps,
  augDimCapstoneGraph,
  augDimAugmentedSolidGraph,
  augDimDiminishedSolidGraph,
  augDimGyrateSolidGraph,
  augDimElementaryGraph,
} from "./cutPasteUtils"
import PolyhedronForme from "math/formes/PolyhedronForme"
import CompositeForme, {
  DiminishedSolidForme,
  GyrateSolidForme,
} from "math/formes/CompositeForme"
import CapstoneForme from "math/formes/CapstoneForme"
import { toDirected } from "../operationPairs"

function removeCap(polyhedron: Polyhedron, cap: Cap) {
  const boundary = cap.boundary()
  const oldToNew = mapObject(boundary.vertices, (vertex, i) => [
    vertex.index,
    i,
  ])
  const mockPolyhedron = polyhedron.withChanges((s) =>
    s
      .addVertices(boundary.vertices)
      .mapFaces((face) => {
        if (face.inSet(cap.faces())) {
          return face
        }
        return face.vertices.map((v) => {
          return v.inSet(boundary.vertices)
            ? polyhedron.numVertices() + oldToNew[v.index]
            : v.index
        })
      })
      .addFaces([
        range(
          polyhedron.numVertices(),
          polyhedron.numVertices() + boundary.numSides,
        ),
      ]),
  )

  const endVertices = getTransformedVertices(
    [cap],
    () => boundary.centroid(),
    mockPolyhedron.vertices,
  )

  return {
    animationData: {
      start: mockPolyhedron,
      endVertices,
    },
    result: removeExtraneousVertices(
      polyhedron.withChanges((s) =>
        s.withoutFaces(cap.faces()).addFaces([cap.boundary().vertices]),
      ),
    ),
  }
}

const diminishCapstone: CutPasteOpArgs<CapOptions, CapstoneForme> = {
  graph: toDirected("right", augDimCapstoneGraph),
  toGraphOpts(forme, { cap }) {
    if (!forme.specs.isCupolaRotunda()) return {} as any
    return { using: cap!.type as any } as any
  },
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
}

const diminishAugmentedSolids: CutPasteOpArgs<CapOptions, CompositeForme> = {
  graph: toDirected("right", augDimAugmentedSolidGraph),
  toGraphOpts() {
    return {} as any
  },
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
}

// FIXME do octahedron and rhombicuboctahedron as well
const diminishDiminishedSolid: CutPasteOpArgs<
  CapOptions,
  DiminishedSolidForme
> = {
  graph: toDirected("right", augDimDiminishedSolidGraph),
  toGraphOpts(forme, { cap }) {
    return { align: forme.alignment(cap!) } as any
  },
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
}

const diminishGyrateSolid: CutPasteOpArgs<CapOptions, GyrateSolidForme> = {
  graph: toDirected("right", augDimGyrateSolidGraph),
  toGraphOpts(forme, { cap }) {
    return {
      align: forme.isGyrate(cap!) ? undefined : forme.alignment(cap!),
      gyrate: forme.isGyrate(cap!) ? "ortho" : "gyro",
    } as any
  },
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
}

const diminishElementary: CutPasteOpArgs<
  CapOptions,
  PolyhedronForme<Elementary>
> = {
  graph: toDirected("right", augDimElementaryGraph),
  toGraphOpts(forme, opts) {
    return {} as any
  },
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
}

export const diminish = makeOperation("diminish", {
  ...combineOps<CapOptions, PolyhedronForme<CutPasteSpecs>>([
    diminishCapstone,
    diminishAugmentedSolids,
    diminishDiminishedSolid,
    diminishGyrateSolid,
    diminishElementary,
  ]),
  ...capOptionArgs,
})
