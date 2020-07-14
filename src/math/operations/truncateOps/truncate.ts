import { set, range } from "lodash-es"

import { repeat } from "utils"
import Classical from "data/specs/Classical"
import { PRECISION } from "math/geom"
import { Polyhedron } from "math/polyhedra"
import Operation from "../Operation"
import metaTruncate from "../../operations-new/truncate"

function duplicateVertices(polyhedron: Polyhedron) {
  const mapping: NestedRecord<number, number, number> = {}
  const count = polyhedron.getVertex().adjacentFaces().length
  polyhedron.vertices.forEach((v) => {
    v.adjacentFaces().forEach((face, i) => {
      set(mapping, [face.index, v.index], i)
    })
  })

  return polyhedron.withChanges((solid) => {
    return solid
      .withVertices(polyhedron.vertices.flatMap((v) => repeat(v.value, count)))
      .mapFaces((face) => {
        return face.vertices.flatMap((v) => {
          const base = count * v.index
          const j = mapping[face.index][v.index]
          return [base + ((j + 1) % count), base + j]
        })
      })
      .addFaces(
        polyhedron.vertices.map((v) =>
          range(v.index * count, (v.index + 1) * count),
        ),
      )
  })
}

function doRectify(polyhedron: Polyhedron) {
  const duplicated = duplicateVertices(polyhedron)

  const rectifiedVertices = duplicated.vertices.map((vertex) => {
    const adjacentVertices = vertex.adjacentVertices()
    const v = vertex.vec
    const v1 = adjacentVertices.find(
      (adj) => adj.vec.distanceTo(v) > PRECISION,
    )!
    return v.interpolateTo(v1.vec, 0.5)
  })
  return {
    animationData: {
      start: duplicated,
      endVertices: rectifiedVertices,
    },
  }
}

export const truncate = new Operation<{}, Classical>("truncate", {
  apply({ geom }) {
    return metaTruncate.apply(geom)
  },

  canApplyTo(info): info is Classical {
    return metaTruncate.canApplyTo(info)
  },

  getResult({ specs }) {
    return metaTruncate.getResult(specs)
  },
})

export const rectify = new Operation<{}, Classical>("rectify", {
  apply({ geom }) {
    return doRectify(geom)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return info.isRegular()
  },

  getResult({ specs }) {
    return specs.withData({ operation: "rectify" })
  },
})
