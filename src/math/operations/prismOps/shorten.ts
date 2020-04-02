import { Polyhedron } from "math/polyhedra"
import { Twist } from "types"
import {
  antiprismHeight,
  getChirality,
  isGyroelongatedBiCupola,
  getAdjustInformation,
  getScaledPrismVertices,
} from "./prismUtils"
import makeOperation from "../makeOperation"

function doShorten(polyhedron: Polyhedron, options: Options) {
  const adjustInfo = getAdjustInformation(polyhedron)
  const { boundary } = adjustInfo
  const isAntiprism = boundary.adjacentFaces()[0].numSides === 3
  const { twist = isAntiprism ? "left" : undefined } = options

  const n = boundary.numSides
  const scale = polyhedron.edgeLength() * (twist ? antiprismHeight(n) : 1)

  const endVertices = getScaledPrismVertices(adjustInfo, -scale, twist)

  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  }
}

interface Options {
  twist?: Twist
}
export const shorten = makeOperation<Options>("shorten", {
  apply(info, polyhedron, options) {
    return doShorten(polyhedron, options)
  },

  optionTypes: ["twist"],

  canApplyTo(info) {
    return info.isCapstone() && !info.isShortened()
  },

  getResult(info, { twist }, polyhedron) {
    if (!info.isCapstone()) throw new Error()
    const gyrate = (() => {
      if (!isGyroelongatedBiCupola(info)) return info.data.gyrate
      const chirality = getChirality(polyhedron)
      return twist === chirality ? "ortho" : "gyro"
    })()
    return info.withData({ elongation: null, gyrate })
  },

  hasOptions(info) {
    return isGyroelongatedBiCupola(info)
  },

  *allOptionCombos(info) {
    if (isGyroelongatedBiCupola(info)) {
      yield { twist: "left" }
      yield { twist: "right" }
    } else {
      yield {}
    }
  },
})
