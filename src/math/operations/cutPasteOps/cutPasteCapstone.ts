import Capstone from "data/specs/Capstone"
import CapstoneForme from "math/formes/CapstoneForme"
import { makeCutPastePair } from "./cutPasteUtils"
import { capOrientation } from "./addCap"

export default makeCutPastePair<CapstoneForme>({
  graph: function* () {
    for (const cap of Capstone.query.where(
      (s) => !s.isPrismatic() && (s.isBi() || !s.isShortened()),
    )) {
      for (const capType of cap.capTypes()) {
        yield {
          left: cap.remove(capType),
          right: cap,
          options: {
            left: { gyrate: cap.data.gyrate, using: capType },
            right: { using: capType },
          },
        }
      }
    }
  },
  toAugGraphOpts($, { face, ...opts }) {
    return opts
  },
  toDimGraphOpts(forme, { cap }) {
    if (!forme.specs.isCupolaRotunda()) return {}
    return { using: cap.type as any }
  },
  baseAxis(forme, { gyrate }) {
    const { specs } = forme
    if (specs.isPrismatic() || specs.isPrimary() || specs.isGyroelongated()) {
      return
    }
    const orientationFn = capOrientation(forme.baseCaps()[0].type as any)
    return (edge) => {
      edge = edge.twin()
      if (!specs.isShortened()) edge = edge.next().next().twin()
      return gyrate === "ortho" ? orientationFn(edge) : !orientationFn(edge)
    }
  },
})
