import { range } from "lodash-es"

import Capstone from "data/specs/Capstone"
import Composite from "data/specs/Composite"
import Elementary from "data/specs/Elementary"
import { mapObject } from "utils"
import {
  getTransformedVertices,
  removeExtraneousVertices,
} from "../operationUtils"
import { makeOperation } from "../Operation"
import { Polyhedron, Cap } from "math/polyhedra"
import {
  inc,
  dec,
  CutPasteSpecs,
  CapOptions,
  capOptionArgs,
  CutPasteOpArgs,
  combineOps,
} from "./cutPasteUtils"
import PolyhedronForme from "math/formes/PolyhedronForme"
import {
  DiminishedSolidForme,
  GyrateSolidForme,
} from "math/formes/CompositeForme"

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

const diminishCapstone: CutPasteOpArgs<
  CapOptions,
  Capstone,
  PolyhedronForme<Capstone>
> = {
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
  canApplyTo(info) {
    if (!info.isCapstone()) return false
    if (info.isPrismatic()) return false
    return !(info.isMono() && info.isShortened())
  },
  getResult({ specs }, { cap }) {
    const { count, rotundaCount = 0 } = specs.data
    return specs.withData({
      count: dec(count) as any,
      rotundaCount: (cap.type === "rotunda"
        ? dec(rotundaCount)
        : rotundaCount) as any,
    })
  },
}

const diminishAugmentedSolids: CutPasteOpArgs<
  CapOptions,
  Composite,
  PolyhedronForme<Composite>
> = {
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
  canApplyTo(specs) {
    return specs.isComposite() && specs.isAugmentedSolid()
  },
  getResult({ specs }) {
    const { source, augmented } = specs.data
    return specs.withData({
      augmented: dec(augmented),
      align:
        augmented === 3 && source.canonicalName() !== "triangular prism"
          ? "meta"
          : undefined,
    })
  },
}

// FIXME do octahedron and rhombicuboctahedron as well
const diminishDiminishedSolid: CutPasteOpArgs<
  CapOptions,
  Composite,
  DiminishedSolidForme
> = {
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },

  canApplyTo(specs) {
    if (!specs.isComposite()) return false
    const { source, diminished, augmented } = specs.data
    if (source.canonicalName() !== "icosahedron") return false
    return (diminished < 3 || augmented === 1) && !specs.isPara()
  },

  getResult(forme, { cap }) {
    const { specs } = forme
    if (specs.isAugmented()) return specs.withData({ augmented: 0 })
    return specs.withData({
      diminished: inc(specs.data.diminished),
      align: forme.alignment(cap),
    })
  },
}

const diminishGyrateSolid: CutPasteOpArgs<
  CapOptions,
  Composite,
  GyrateSolidForme
> = {
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },
  canApplyTo(specs) {
    if (!specs.isComposite()) return false
    const { diminished, gyrate } = specs.data
    if (!specs.isGyrateSolid()) return false
    if (diminished === 2 && gyrate === 0) return !specs.isPara()
    return diminished < 3
  },
  getResult(forme, { cap }) {
    const { specs } = forme
    const { diminished, gyrate } = specs.data
    if (forme.isGyrate(cap)) {
      // we're just removing a gyrated cap in this case
      return specs.withData({
        gyrate: dec(gyrate),
        diminished: inc(diminished),
      })
    } else {
      return specs.withData({
        diminished: inc(diminished),
        align: forme.alignment(cap),
      })
    }
  },
}

const diminishElementary: CutPasteOpArgs<
  CapOptions,
  Elementary,
  PolyhedronForme<Elementary>
> = {
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },

  canApplyTo(specs) {
    return specs.canonicalName() === "augmented sphenocorona"
  },
  getResult() {
    return Elementary.query.withName("sphenocorona")
  },
}

export const diminish = makeOperation("diminish", {
  ...combineOps<CapOptions, CutPasteSpecs, PolyhedronForme<CutPasteSpecs>>([
    diminishCapstone,
    diminishAugmentedSolids,
    diminishDiminishedSolid,
    diminishGyrateSolid,
    diminishElementary,
  ]),
  ...capOptionArgs,
})
