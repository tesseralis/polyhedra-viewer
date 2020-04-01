import { range } from "lodash-es"

import Prismatic from "data/specs/Prismatic"
import Elementary from "data/specs/Elementary"
import Composite from "data/specs/Composite"
import { mapObject } from "utils"
import {
  getTransformedVertices,
  removeExtraneousVertices,
} from "../operationUtils"
import makeOperation from "../makeOperation"
import { Polyhedron, Cap } from "math/polyhedra"
import { getCapAlignment, getCupolaGyrate } from "./cutPasteUtils"

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

function hasGyrateOpt(polyhedron: Polyhedron) {
  // polyhedron has a gyrate opt if it is a rhombicosidodecahedron
  // with at least one gyrate
  const info = polyhedron.info
  if (!info.isComposite()) return false
  const { source, gyrate = 0 } = info.data
  return source.canonicalName() === "rhombicosidodecahedron" && gyrate > 0
}

function hasAlignOpt(polyhedron: Polyhedron) {
  if (!Composite.query.hasName(polyhedron.name)) return false
  // Get the polyhedron data as a Composite if possible
  const info = Composite.query.withName(polyhedron.name)
  const { diminished = 0, gyrate = 0 } = info.data
  return diminished + gyrate === 1
}

interface Options {
  cap: Cap
}
export const diminish = makeOperation<Options>("diminish", {
  apply(polyhedron, { cap }) {
    return removeCap(polyhedron, cap)
  },

  optionTypes: ["cap"],

  canApplyTo(info) {
    if (info.isCapstone()) {
      return !(info.isMono() && info.isShortened())
    }
    if (info.isComposite()) {
      const { source, augmented = 0, diminished = 0 } = info.data
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
      const { source, augmented = 0, diminished = 0, gyrate = 0 } = info.data
      if (source.canonicalName() === "rhombicosidodecahedron") {
        const totalCount = diminished + gyrate
        const gyration = getCupolaGyrate(cap)
        if (gyration === "ortho") {
          // we're just removing a gyrated cap in this case
          return info.withData({
            gyrate: (gyrate - 1) as any,
            diminished: (diminished + 1) as any,
          })
        } else {
          return info.withData({
            diminished: (diminished + 1) as any,
            align:
              totalCount === 1 ? getCapAlignment(polyhedron, cap) : undefined,
          })
        }
      }
      if (source.canonicalName() === "icosahedron") {
        if (augmented === 1) return info.withData({ augmented: 0 })
        return info.withData({
          diminished: (diminished + 1) as any,
          align:
            diminished === 1 ? getCapAlignment(polyhedron, cap) : undefined,
        })
      }
      return info.withData({
        augmented: (augmented - 1) as any,
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

  resultsFilter(polyhedron, { cap }) {
    const options: Record<string, string> = {}
    if (!cap) {
      throw new Error("Invalid cap")
    }
    const vertices = cap.innerVertices()
    // If diminishing a pentagonal cupola/rotunda, check which one it is
    if (vertices.length === 5) {
      options.type = "cupola"
    } else if (vertices.length === 10) {
      options.type = "rotunda"
    }

    if (hasGyrateOpt(polyhedron)) {
      options.gyrate = getCupolaGyrate(cap)
    }

    if (options.gyrate !== "ortho" && hasAlignOpt(polyhedron)) {
      options.align = getCapAlignment(polyhedron, cap)
    }
    return options
  },

  hasOptions() {
    return true
  },

  allOptionCombos(polyhedron) {
    return Cap.getAll(polyhedron).map((cap) => ({ cap }))
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
