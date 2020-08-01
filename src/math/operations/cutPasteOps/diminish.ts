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
  augDimCapstoneGraph,
  augDimAugmentedSolidGraph,
  augDimDiminishedSolidGraph,
  augDimGyrateSolidGraph,
  augDimElementaryGraph,
  DimGraphOpts,
} from "./cutPasteUtils"
import PolyhedronForme from "math/formes/PolyhedronForme"
import CompositeForme, {
  DiminishedSolidForme,
  GyrateSolidForme,
} from "math/formes/CompositeForme"
import CapstoneForme from "math/formes/CapstoneForme"
import { toDirected, combineOps, OpInput } from "../operationPairs"

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

type DimOpArgs<F extends PolyhedronForme> = OpInput<CapOptions, F, DimGraphOpts>

const diminishCapstone: DimOpArgs<CapstoneForme> = {
  graph: toDirected("right", augDimCapstoneGraph),
  toGraphOpts(forme, { cap }) {
    if (!forme.specs.isCupolaRotunda()) return {}
    return { using: cap.type as any }
  },
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
}

const diminishAugmentedSolids: DimOpArgs<CompositeForme> = {
  graph: toDirected("right", augDimAugmentedSolidGraph),
  toGraphOpts: () => ({}),
  apply: ({ geom }, { cap }) => removeCap(geom, cap),
}

// FIXME do octahedron and rhombicuboctahedron as well
const diminishDiminishedSolid: DimOpArgs<DiminishedSolidForme> = {
  graph: toDirected("right", augDimDiminishedSolidGraph),
  toGraphOpts: (forme, { cap }) => ({ align: forme.alignment(cap) }),
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
}

const diminishGyrateSolid: DimOpArgs<GyrateSolidForme> = {
  graph: toDirected("right", augDimGyrateSolidGraph),
  toGraphOpts(forme, { cap }) {
    if (forme.isGyrate(cap)) {
      return { gyrate: "ortho" }
    } else {
      return { gyrate: "gyro", align: forme.alignment(cap) }
    }
  },
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
}

const diminishElementary: DimOpArgs<PolyhedronForme<Elementary>> = {
  graph: toDirected("right", augDimElementaryGraph),
  toGraphOpts: () => ({}),
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
}

export const diminish = makeOperation("diminish", {
  ...combineOps<PolyhedronForme<CutPasteSpecs>, CapOptions, DimGraphOpts>([
    diminishCapstone,
    diminishAugmentedSolids,
    diminishDiminishedSolid,
    diminishGyrateSolid,
    diminishElementary,
  ]),
  ...capOptionArgs,
})
