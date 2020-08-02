import { makeCutPastePair } from "./cutPasteUtils"
import { Elementary } from "data/specs"

export default makeCutPastePair({
  graph: function* () {
    yield {
      left: Elementary.query.withName("sphenocorona"),
      right: Elementary.query.withName("augmented sphenocorona"),
    }
  },
})
