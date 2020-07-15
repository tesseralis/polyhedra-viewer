import { Polygon } from "data/polygons"
import Classical from "data/specs/Classical"
import { Polyhedron } from "math/polyhedra"
import {
  isExpandedFace,
  getResizedVertices,
  getExpandedFaces,
} from "./resizeUtils"
import Operation from "../Operation"
import {
  expand as metaExpand,
  snub as metaSnub,
} from "../../operations-new/expand"

// TODO hopefully there's a better way to do this once we make the new opGraph
type FaceType = Polygon

interface Options {
  faceType?: FaceType
}

// contract length of a bevelled polyhedron
// TODO calculate this without a reference
function getContractLengthSemi(
  polyhedron: Polyhedron,
  faceType: FaceType,
  reference: Polyhedron,
) {
  const referenceFace = reference.faceWithNumSides(faceType)
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength()
  return referenceLength
}

export function doSemiContract(
  polyhedron: Polyhedron,
  { faceType = 6 }: Options,
  result: Polyhedron,
) {
  const resultLength = getContractLengthSemi(polyhedron, faceType, result)

  // Take all the stuff and push it inwards
  const contractFaces = getExpandedFaces(polyhedron, faceType)

  const endVertices = getResizedVertices(contractFaces, resultLength, 0)
  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  }
}

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract = new Operation<Options, Classical>("contract", {
  apply({ specs, geom }, options, result) {
    if (metaExpand.canUnapplyTo(specs)) {
      return metaExpand.unapply(geom, {
        faceType: (options.faceType as any) || 3,
      })
    }
    if (metaSnub.canUnapplyTo(specs)) {
      // FIXME args
      return metaSnub.unapply(geom, {})
    }
    // FIXME turn semi-expand into a new operation
    return doSemiContract(geom, options, result)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    if (metaExpand.canUnapplyTo(info)) return true
    if (metaSnub.canUnapplyTo(info)) return true
    return info.isBevelled()
  },

  getResult({ specs }, { faceType = 3 }) {
    if (metaExpand.canUnapplyTo(specs))
      return metaExpand.getSource(specs, { faceType: faceType as any })
    if (metaSnub.canUnapplyTo(specs)) return metaSnub.getSource(specs)
    const isVertex = faceType === 6
    return specs.withData({
      operation: "truncate",
      facet: isVertex ? "vertex" : "face",
    })
  },

  hasOptions(info) {
    return !info.isTetrahedral()
  },

  *allOptionCombos({ specs }) {
    if (specs.isTetrahedral()) {
      yield {}
    } else {
      const multiplier = specs.isBevelled() ? 2 : 1
      yield { faceType: (3 * multiplier) as any }
      yield { faceType: (specs.data.family * multiplier) as any }
    }
  },

  hitOption: "faceType",
  getHitOption({ specs, geom }, hitPoint) {
    const hitFace = geom.hitFace(hitPoint)
    const faceType = hitFace.numSides as FaceType // TODO unsure if always valid
    if (specs.isBevelled()) {
      const isValid = hitFace.numSides > 4
      return isValid ? { faceType } : {}
    }
    const isValid = isExpandedFace(geom, hitFace)
    return isValid ? { faceType } : {}
  },

  faceSelectionStates({ specs, geom }, { faceType }) {
    if (specs.isBevelled()) {
      return geom.faces.map((face) => {
        if (faceType && face.numSides === faceType) {
          return "selected"
        }
        if (face.numSides !== 4) return "selectable"
        return undefined
      })
    }
    return geom.faces.map((face) => {
      if (faceType && isExpandedFace(geom, face, faceType)) return "selected"
      if (isExpandedFace(geom, face)) return "selectable"
      return undefined
    })
  },
})
