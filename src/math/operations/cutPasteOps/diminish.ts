import { range } from "lodash-es"

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
