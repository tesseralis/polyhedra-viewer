import { Twist } from "types"
import Capstone from "data/specs/Capstone"
import { Polyhedron, Cap, VertexList } from "math/polyhedra"
import { expandEdges } from "../operationUtils"
import makeOperation from "../makeOperation"
import { antiprismHeight, getScaledPrismVertices } from "./prismUtils"

function doElongate(polyhedron: Polyhedron, twist?: Twist) {
  const caps = Cap.getAll(polyhedron)
  const boundary = caps[0].boundary()
  const n = boundary.numSides
  const duplicated = expandEdges(polyhedron, boundary.edges, twist)
  let vertexSets: VertexList[]

  const duplicatedCaps = Cap.getAll(duplicated)
  if (duplicatedCaps.length === 2) {
    vertexSets = duplicatedCaps
  } else {
    // Otherwise it's the largest face
    vertexSets = [
      duplicated.faces[boundary.adjacentFaces()[0].index],
      Cap.getAll(duplicated)[0],
    ]
  }
  const adjustInfo = { vertexSets, boundary }

  const height = polyhedron.edgeLength() * (twist ? antiprismHeight(n) : 1)

  const endVertices = getScaledPrismVertices(adjustInfo, height, twist)
  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  }
}

export const elongate = makeOperation<Capstone>("elongate", {
  apply(info, polyhedron) {
    return doElongate(polyhedron)
  },

  canApplyTo(info): info is Capstone {
    if (!info.isCapstone()) return false
    return info.isShortened() && info.data.base > 2
  },

  getResult(info) {
    return info.withData({ elongation: "prism" })
  },
})

interface Options {
  twist?: Twist
}
export const gyroelongate = makeOperation<Capstone, Options>("gyroelongate", {
  apply(info, polyhedron: Polyhedron, { twist = "left" }) {
    return doElongate(polyhedron, twist)
  },

  canApplyTo(info): info is Capstone {
    if (!info.isCapstone()) return false
    // Cannot gyroelongate fastigium or triangular pyramid
    if (info.isDigonal()) return false
    if (info.isPyramid() && info.isTriangular()) return false
    return info.isShortened()
  },

  getResult(info) {
    return info.withData({ elongation: "antiprism" })
  },

  hasOptions(info) {
    return !info.isPyramid() && info.isBi()
  },

  *allOptionCombos() {
    yield { twist: "left" }
    yield { twist: "right" }
  },
})
