import { range } from "lodash-es"

import Prismatic from "data/specs/Prismatic"
import Elementary from "data/specs/Elementary"
import { mapObject } from "utils"
import {
  getTransformedVertices,
  removeExtraneousVertices,
} from "../operationUtils"
import makeOperation from "../makeOperation"
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
    (p) => boundary.centroid(),
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
export const diminish = makeOperation<CutPasteSpecs, Options>("diminish", {
  apply(info, polyhedron, { cap }) {
    return removeCap(polyhedron, cap)
  },

  canApplyTo(info): info is CutPasteSpecs {
    if (info.isCapstone()) {
      return !(info.isMono() && info.isShortened())
    }
    if (info.isComposite()) {
      const { source, augmented, diminished } = info.data
      if (source.canonicalName() === "rhombicosidodecahedron") {
        return diminished < 3
      }
      if (source.canonicalName() === "icosahedron") {
        return diminished < 3 || augmented === 1
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

  getResult(info, { cap }, polyhedron) {
    if (info.isCapstone()) {
      const { count, elongation, base, type } = info.data
      if (count === 1) {
        return Prismatic.query.withData({
          type: elongation as any,
          base: info.isPyramid() ? base : ((base * 2) as any),
        })
      } else {
        const capType = cap.type
        return info.withData({
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
    if (info.isComposite()) {
      const { source, augmented, diminished, gyrate } = info.data
      if (source.canonicalName() === "rhombicosidodecahedron") {
        const gyration = getCupolaGyrate(cap)
        if (gyration === "ortho") {
          // we're just removing a gyrated cap in this case
          return info.withData({
            gyrate: dec(gyrate),
            diminished: inc(diminished),
          })
        } else {
          return info.withData({
            diminished: inc(diminished),
            align: info.isMono() ? getCapAlignment(polyhedron, cap) : undefined,
          })
        }
      }
      if (source.canonicalName() === "icosahedron") {
        if (augmented === 1) return info.withData({ augmented: 0 })
        return info.withData({
          diminished: inc(diminished),
          align:
            diminished === 1 ? getCapAlignment(polyhedron, cap) : undefined,
        })
      }
      return info.withData({
        augmented: dec(augmented),
        align:
          augmented === 3 && source.canonicalName() !== "triangular prism"
            ? "meta"
            : undefined,
      })
    }
    if (info.isElementary()) {
      return Elementary.query.withName("sphenocorona")
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
