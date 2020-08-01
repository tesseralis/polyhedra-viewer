import Composite from "data/specs/Composite"
import CompositeForme from "math/formes/CompositeForme"
import { makeCutPastePair } from "./cutPasteUtils"

export default makeCutPastePair<CompositeForme>({
  graph: function* () {
    for (const solid of Composite.query.where(
      (s) => s.isAugmentedSolid() && s.isAugmented(),
    )) {
      yield {
        left: solid.diminish(),
        right: solid,
        options: {
          left: { align: solid.data.align },
          right: {},
        },
      }
    }
  },
  toAugGraphOpts(forme, { face }) {
    return { align: forme.alignment(face) }
  },
  baseAxis({ specs }) {
    const { source } = specs.data
    if (source.isClassical() && source.isTruncated()) {
      return (edge) => edge.twinFace().numSides === 3
    }
  },
})
