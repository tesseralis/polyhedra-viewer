import { Graph } from "./Graph"
import Elementary from "../specs/Elementary"

export default function elementaryGraph(g: Graph) {
  // TODO snub antiprisms

  const sphenocorona = Elementary.query.withName("sphenocorona")
  const augmented = Elementary.query.withName("augmented sphenocorona")

  g.addEdge("augment", sphenocorona, augmented)
}
