import { Polyhedron } from "math/polyhedra"
import Capstone from "data/specs/Capstone"
import { Twist } from "types"
import {
  antiprismHeight,
  getChirality,
  isGyroelongatedBiCupola,
  getAdjustInformation,
  getScaledPrismVertices,
} from "./prismUtils"
import Operation from "../Operation"

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
export const shorten = new Operation<Options, Capstone>("shorten", {
  apply({ geom }, options) {
    return doShorten(geom, options)
  },

  canApplyTo(info): info is Capstone {
    return info.isCapstone() && !info.isShortened()
  },

  getResult({ specs, geom }, { twist }) {
    const gyrate = (() => {
      if (!isGyroelongatedBiCupola(specs)) return specs.data.gyrate
      const chirality = getChirality(geom)
      return twist === chirality ? "ortho" : "gyro"
    })()
    return specs.withData({ elongation: null, gyrate })
  },

  hasOptions(info) {
    return isGyroelongatedBiCupola(info)
  },

  *allOptionCombos({ specs }) {
    if (isGyroelongatedBiCupola(specs)) {
      yield { twist: "left" }
      yield { twist: "right" }
    } else {
      yield {}
    }
  },
})
