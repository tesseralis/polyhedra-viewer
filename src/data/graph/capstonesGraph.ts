import { Graph } from "./Graph"

import { prisms, capstones } from "../tables"

export default function capstonesGraph(g: Graph) {
  // prisms can be augmented with a capstone
  for (const { name, base, type } of prisms.getAll()) {
    if (base <= 5) {
      // 3/4/5 prisms can be augmented with a pyramid
      const augmented = capstones.getName({
        elongation: type,
        type: "pyramid",
        count: 1,
      })
      g.addEdge({
        operation: "augment",
        from: name,
        to: augmented,
        options: { capType: "pyramid", base: base as any },
      })
    } else {
      // 6/8/10-prisms can be augmented with a cupola or rotunda
      const allAugmented = capstones.getAll(
        ({ elongation, type: capType, count }) =>
          capType !== "pyramid" && elongation === type && count === 1,
      )
      for (const { name: augName, type: capType } of allAugmented) {
        g.addEdge({
          operation: "augment",
          from: name,
          to: augName,
          options: { capType: capType as any, base: base as any },
        })
      }
    }
  }

  for (const { name, base, type } of capstones.getAll({
    count: 1,
    elongation: "",
  })) {
    // single capstones can be elongated and gyroelongated
    g.addEdge({
      operation: "elongate",
      from: name,
      to: capstones.getName({ base, type, count: 1, elongation: "prism" }),
    })
    g.addEdge({
      operation: "gyroelongate",
      from: name,
      to: capstones.getName({ base, type, count: 1, elongation: "antiprism" }),
    })

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
