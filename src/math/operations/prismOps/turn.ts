import { pivot } from "utils"
import { Twist } from "types"
import { Polyhedron, FaceLike } from "math/polyhedra"
import makeOperation from "../makeOperation"
import {
  getChirality,
  isGyroelongatedBiCupola,
  antiprismHeight,
  getAdjustInformation,
  getScaledPrismVertices,
} from "./prismUtils"

function bisectPrismFaces(
  polyhedron: Polyhedron,
  boundary: FaceLike,
  twist?: Twist,
) {
  const prismFaces = boundary.edges.map((edge) => edge.twinFace())
  const newFaces = boundary.edges.flatMap((edge) => {
    const twinFace = edge.twinFace()
    const [v1, v2, v3, v4] = pivot(
      twinFace.vertices.map((v) => v.index),
      edge.v2.index,
    )

    return twist === "left"
      ? [
          [v1, v2, v4],
          [v2, v3, v4],
        ]
      : [
          [v1, v2, v3],
          [v1, v3, v4],
        ]
  })

  return polyhedron.withChanges((solid) =>
    solid.withoutFaces(prismFaces).addFaces(newFaces),
  )
}

function joinAntiprismFaces(
  polyhedron: Polyhedron,
  boundary: FaceLike,
  twist?: Twist,
) {
  const antiprismFaces = boundary.edges.flatMap((edge) => {
    return [edge.twinFace(), edge.twin().prev().twinFace()]
  })

  const newFaces = boundary.edges.map((edge) => {
    const [v1, v2] = edge.twin().vertices
    const [v3, v4] =
      twist === "left"
        ? edge.twin().prev().twin().next().vertices
        : edge.twin().next().twin().prev().vertices

    return [v1, v2, v3, v4]
  })

  return polyhedron.withChanges((solid) =>
    solid.withoutFaces(antiprismFaces).addFaces(newFaces),
  )
}

interface Options {
  twist?: Twist
}
function doTurn(polyhedron: Polyhedron, { twist = "left" }: Options) {
  const adjustInfo = getAdjustInformation(polyhedron)
  const { boundary } = adjustInfo
  const isAntiprism = boundary.adjacentFaces()[0].numSides === 3

  const duplicated = isAntiprism
    ? polyhedron
    : bisectPrismFaces(polyhedron, boundary, twist)

  const n = boundary.numSides
  const scale =
    polyhedron.edgeLength() * (antiprismHeight(n) - 1) * (isAntiprism ? -1 : 1)

  const endVertices = getScaledPrismVertices(adjustInfo, scale, twist)
  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
    result: isAntiprism
      ? joinAntiprismFaces(polyhedron, boundary, twist).withVertices(
          endVertices,
        )
      : undefined,
  }
}

export const turn = makeOperation<Options>("turn", {
  apply: doTurn,

  optionTypes: ["twist"],

  canApplyTo(info) {
    if (info.isPrismatic()) return info.data.base > 2
    if (!info.isCapstone()) return false
    return !info.isShortened() && info.data.base > 3
  },

  getResult(info, { twist }, polyhedron) {
    if (info.isPrismatic()) {
      return info.withData({
        type: info.data.type === "prism" ? "antiprism" : "prism",
      })
    }

    if (info.isCapstone()) {
      const gyrate = (() => {
        if (!isGyroelongatedBiCupola(polyhedron)) return undefined
        const chirality = getChirality(polyhedron)
        return twist === chirality ? "ortho" : "gyro"
      })()
      return info.withData({
        elongation: info.data.elongation === "prism" ? "antiprism" : "prism",
        gyrate,
      })
    }

    throw new Error()
  },

  hasOptions(polyhedron) {
    const info = polyhedron.info
    return info.isCapstone() && !info.isPyramid() && info.isBi()
  },

  allOptionCombos(polyhedron) {
    if (isGyroelongatedBiCupola(polyhedron)) {
      return [{ twist: "left" }, { twist: "right" }]
    }
    return [{}]
  },
})
