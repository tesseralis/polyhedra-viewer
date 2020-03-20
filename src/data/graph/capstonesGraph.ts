import { Graph } from "./Graph"

import { prisms, capstones } from "../tables"

export default function capstonesGraph(g: Graph) {
  // prisms can be augmented with a capstone
  for (const prism of prisms.getAll()) {
    if (prism.base <= 5) {
      // 3/4/5 prisms can be augmented with a pyramid
      const augmented = capstones.getAll({
        elongation: prism.type,
        type: "pyramid",
        count: 1,
      })

      g.addEdge("augment", prism, augmented[0])
    } else {
      // 6/8/10-prisms can be augmented with a cupola or rotunda
      const allAugmented = capstones.getAll(
        ({ elongation, type: capType, count }) =>
          capType !== "pyramid" && elongation === prism.type && count === 1,
      )
      for (const augmented of allAugmented) {
        g.addEdge("augment", prism, augmented)
      }
    }
  }

  for (const cap of capstones.getAll({
    count: 1,
    elongation: "",
  })) {
    // single capstones can be elongated and gyroelongated
    g.addEdge(
      "elongate",
      cap,
      capstones.getAll({
        base: cap.base,
        type: cap.type,
        count: 1,
        elongation: "prism",
      })[0],
    )
    g.addEdge(
      "gyroelongate",
      cap,
      capstones.getAll({
        base: cap.base,
        type: cap.type,
        count: 1,
        elongation: "antiprism",
      })[0],
    )

    // // can be augmented
    // for (const augmented of capstones.getAll({ base, type, count: 2, elongation: '' })) {
    // g.addEdge({
    //   operation: 'augment',
    //   from: name,
    //   to: augmented.name,
    //   options: {
    //     capType: type,
    //   }
    // })

    // }
  }
}
