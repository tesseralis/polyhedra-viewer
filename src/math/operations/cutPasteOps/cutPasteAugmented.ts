import { Composite } from "specs"
import CompositeForme from "math/formes/CompositeForme"
import { makeCutPastePair } from "./cutPasteUtils"

function getFaceType(solid: Composite) {
  if (solid.isAugmentedPrism()) return 4
  const source = solid.sourceClassical()
  return source.data.family * (source.isTruncated() ? 2 : 1)
}

export default makeCutPastePair<CompositeForme>({
  graph: function* () {
    // Take all augmented solids with at least one augmentation
    // and pair it with its diminishing
    for (const solid of Composite.query.where(
      (s) => s.isAugmentedSolid() && s.isAugmented(),
    )) {
      yield {
        left: solid.diminish(),
        right: solid,
        options: {
          left: {
            align: solid.data.align,
            faceType: getFaceType(solid),
          },
          right: {},
        },
      }
    }
  },
  toAugGraphOpts(forme, { face }) {
    return { align: forme.alignment(face), faceType: face.numSides }
  },
  baseAxis({ specs }) {
    const { source } = specs.data
    // Make sure that augmented truncated polyhedra align
    // the square cupola face to a triangular face
    if (source.isClassical() && source.isTruncated()) {
      return (edge) => edge.twinFace().numSides === 3
    }
  },
})
