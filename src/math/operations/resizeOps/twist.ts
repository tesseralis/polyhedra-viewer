import { pivot } from "utils"
import { Twist } from "types"
import Classical from "data/specs/Classical"
import { Face, Polyhedron } from "math/polyhedra"
import { getTwistSign } from "../operationUtils"
import {
  getSnubAngle,
  getExpandedFaces,
  isExpandedFace,
  getResizedVertices,
  expansionType,
} from "./resizeUtils"
import Operation from "../Operation"

// TODO deduplicate with turn
function bisectEdgeFaces(expandedFaces: Face[], twist: Twist) {
  let newFaces: any[] = []
  const found: Face[] = []

  expandedFaces.forEach((face) => {
    face.edges.forEach((edge) => {
      const twinFace = edge.twinFace()
      if (twinFace.inSet(found)) return

      const [v1, v2, v3, v4] = pivot(
        twinFace.vertices.map((v) => v.index),
        edge.v2.index,
      )

      const fs =
        twist === "left"
          ? [
              [v1, v2, v4],
              [v2, v3, v4],
            ]
          : [
              [v1, v2, v3],
              [v1, v3, v4],
            ]
      newFaces = newFaces.concat(fs)
      found.push(twinFace)
    })
  })

  return expandedFaces[0].polyhedron.withChanges((solid) =>
    solid.withoutFaces(found).addFaces(newFaces),
  )
}

function joinEdgeFaces(twistFaces: Face[], twist: Twist) {
  const newFaces: any[] = []
  const found: Face[] = []
  twistFaces.forEach((face) => {
    face.edges.forEach((edge) => {
      const edgeFace = edge.twinFace()
      if (edgeFace.inSet(found)) return

      const [v1, v2] = edge.twin().vertices
      const [v3, v4] =
        twist === "left"
          ? edge.twin().prev().twin().next().vertices
          : edge.twin().next().twin().prev().vertices

      newFaces.push([v1, v2, v3, v4])
      const otherFace = (twist === "left"
        ? edge.twin().prev()
        : edge.twin().next()
      ).twinFace()
      found.push(edgeFace, otherFace)
    })
  })

  return twistFaces[0].polyhedron.withChanges((solid) =>
    solid.withoutFaces(found).addFaces(newFaces),
  )
}

// TODO deduplicate with expand/contract
function doTwist(
  polyhedron: Polyhedron,
  reference: Polyhedron,
  twist: Twist = "left",
) {
  const isSnub = expansionType(polyhedron) === "snub"
  const f0 = polyhedron.largestFace()
  const n = f0.numSides
  const twistFaces = getExpandedFaces(polyhedron, n)

  const referenceFace =
    reference.faces.find((face) => isExpandedFace(reference, face, n)) ??
    reference.getFace()
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength()

  const refFaces = getExpandedFaces(reference, n)
  const angle = !isSnub
    ? getTwistSign(twist) * Math.abs(getSnubAngle(reference, refFaces))
    : -getSnubAngle(polyhedron, twistFaces)
  const snubTwist = angle > 0 ? "left" : "right"

  const duplicated = isSnub
    ? polyhedron
    : bisectEdgeFaces(twistFaces, snubTwist)
  const endVertices = getResizedVertices(twistFaces, referenceLength, angle)

  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
    result: isSnub
      ? joinEdgeFaces(twistFaces, snubTwist).withVertices(endVertices)
      : undefined,
  }
}

interface Options {
  twist?: Twist
}
export const twist = new Operation<Options, Classical>("twist", {
  apply({ geom }, { twist: twistOpt }, result) {
    return doTwist(geom, result, twistOpt)
  },

  canApplyTo(info): info is Classical {
    return info.isClassical() && (info.isCantellated() || info.isSnub())
  },

  getResult({ specs }) {
    return specs.withData({
      operation: specs.isCantellated() ? "snub" : "cantellate",
    })
  },

  hasOptions(info) {
    return !info.isTetrahedral() && info.isCantellated()
  },

  *allOptionCombos({ specs }) {
    if (!specs.isSnub()) {
      yield { twist: "left" }
      yield { twist: "right" }
    }
    yield {}
  },
})
