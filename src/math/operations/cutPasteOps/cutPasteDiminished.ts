import Composite from "data/specs/Composite"
import { DiminishedSolidForme } from "math/formes/CompositeForme"
import { makeCutPastePair } from "./cutPasteUtils"

export default makeCutPastePair<DiminishedSolidForme>({
  graph: function* () {
    for (const solid of Composite.query.where(
      (s) => s.isDiminishedSolid() && s.isDiminished() && !s.isAugmented(),
    )) {
      const options = solid.isTri() ? [3, 5] : [5]
      for (const faceType of options) {
        yield {
          left: solid,
          right: solid.augmentDiminished(faceType === 5),
          options: {
            left: { faceType },
            right: { align: solid.data.align },
          },
        }
      }
    }
  },
  toAugGraphOpts(forme, { face }) {
    return { faceType: face.numSides }
  },
  toDimGraphOpts(forme, { cap }) {
    return { align: forme.alignment(cap) }
  },
})
