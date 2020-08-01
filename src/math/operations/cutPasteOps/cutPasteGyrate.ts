import Composite from "data/specs/Composite"
import { GyrateSolidForme } from "math/formes/CompositeForme"
import { makeCutPastePair } from "./cutPasteUtils"
import { gyrations } from "data/specs/Capstone"

export default makeCutPastePair<GyrateSolidForme>({
  graph: function* () {
    for (const solid of Composite.query.where(
      (s) => s.isGyrateSolid() && s.isDiminished(),
    )) {
      for (const gyrate of gyrations) {
        yield {
          left: solid,
          right: solid.augmentGyrate(gyrate),
          options: {
            left: { gyrate },
            right: { gyrate, align: solid.data.align },
          },
        }
      }
    }
  },
  toAugGraphOpts($, { face, ...opts }) {
    return { gyrate: opts.gyrate }
  },
  toDimGraphOpts(forme, { cap }) {
    if (forme.isGyrate(cap)) {
      return { gyrate: "ortho" }
    } else {
      return { gyrate: "gyro", align: forme.alignment(cap) }
    }
  },
  baseAxis($, { gyrate }) {
    return (edge) => edge.twinFace().numSides === (gyrate === "ortho" ? 4 : 5)
  },
})
