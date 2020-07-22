import { range } from "lodash-es"

import Prismatic from "data/specs/Prismatic"
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
  getCapAlignment,
  getCupolaGyrate,
} from "./cutPasteUtils"

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

interface Options {
  cap: Cap
}
export const diminish = makeOperation<Options, CutPasteSpecs>("diminish", {
  apply({ geom }, { cap }) {
    return removeCap(geom, cap)
  },

  canApplyTo(info) {
    if (info.isCapstone()) {
      return !(info.isMono() && info.isShortened())
    }
    if (info.isComposite()) {
      const { source, augmented, diminished, gyrate } = info.data
      if (source.canonicalName() === "rhombicosidodecahedron") {
        if (diminished === 2 && gyrate === 0) return !info.isPara()
        return diminished < 3
      }
      if (source.canonicalName() === "icosahedron") {
        return (diminished < 3 || augmented === 1) && !info.isPara()
      }
      return augmented > 0
    }
    if (info.isElementary()) {
      return info.canonicalName() === "augmented sphenocorona"
    }
    return false
  },

  isPreferredSpec(info) {
    if (info.canonicalName() === "gyroelongated pentagonal pyramid") {
      return info.isComposite()
    }
    return true
  },

  getResult({ specs, geom }, { cap }) {
    if (specs.isCapstone()) {
      const { count, elongation, base, type } = specs.data
      if (count === 1) {
        return Prismatic.query.withData({
          type: elongation as any,
          base: specs.isPyramid() ? base : ((base * 2) as any),
        })
      } else {
        const capType = cap.type
        return specs.withData({
          count: 1,
          type:
            type === "cupolarotunda"
              ? capType === "rotunda"
                ? "cupola"
                : "rotunda"
              : type,
        })
      }
    }
    if (specs.isComposite()) {
      const { source, augmented, diminished, gyrate } = specs.data
      if (source.canonicalName() === "rhombicosidodecahedron") {
        const gyration = getCupolaGyrate(cap)
        if (gyration === "ortho") {
          // we're just removing a gyrated cap in this case
          return specs.withData({
            gyrate: dec(gyrate),
            diminished: inc(diminished),
          })
        } else {
          return specs.withData({
            diminished: inc(diminished),
            align: specs.isMono() ? getCapAlignment(geom, cap) : undefined,
          })
        }
      }
      if (source.canonicalName() === "icosahedron") {
        if (augmented === 1) return specs.withData({ augmented: 0 })
        return specs.withData({
          diminished: inc(diminished),
          align: diminished === 1 ? getCapAlignment(geom, cap) : undefined,
        })
      }
      return specs.withData({
        augmented: dec(augmented),
        align:
          augmented === 3 && source.canonicalName() !== "triangular prism"
            ? "meta"
            : undefined,
      })
    }
    if (specs.isElementary()) {
      return Elementary.query.withName("sphenocorona")
    }
    throw new Error()
  },

  hasOptions() {
    return true
  },

  *allOptionCombos({ geom }) {
    for (const cap of Cap.getAll(geom)) yield { cap }
  },

  hitOption: "cap",
  getHitOption({ geom }, hitPnt) {
    const cap = Cap.find(geom, hitPnt)
    return cap ? { cap } : {}
  },

  faceSelectionStates({ geom }, { cap }) {
    const allCapFaces = Cap.getAll(geom).flatMap((cap) => cap.faces())
    return geom.faces.map((face) => {
      if (cap instanceof Cap && face.inSet(cap.faces())) return "selected"
      if (face.inSet(allCapFaces)) return "selectable"
      return undefined
    })
  },
})
