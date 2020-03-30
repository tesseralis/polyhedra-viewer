import type Graph from "./Graph"

import Prismatic from "../specs/Prismatic"
import Capstone from "../specs/Capstone"

function getCapTypes(base: 3 | 4 | 5): ("cupola" | "rotunda")[] {
  if (base === 5) {
    return ["cupola", "rotunda"]
  }
  return ["cupola"]
}

export default function capstoneGraph(g: Graph) {
  for (const prismatic of Prismatic.getAll()) {
    const { base, type } = prismatic.data

    // Prisms can be turned into antiprisms
    if (prismatic.isPrism()) {
      g.addEdge("turn", prismatic, prismatic.withData({ type: "antiprism" }))
    }
    if (base === 2) {
      continue
    }
    if (base <= 5) {
      // Prisms of with a base <= 5 can be augmented with a pyramid
      if (type === "antiprism" && base === 3) {
        continue
      }
      g.addEdge(
        "augment",
        prismatic,
        Capstone.query.withData({
          type: "pyramid",
          count: 1,
          elongation: type,
          base: base as any,
        }),
        { type: "pyramid", base: base as any },
      )
    } else {
      for (const capType of getCapTypes((base / 2) as any)) {
        g.addEdge(
          "augment",
          prismatic,
          Capstone.query.withData({
            type: capType,
            count: 1,
            elongation: type,
            base: (base / 2) as any,
          }),
          { type: capType, base: (base / 2) as any },
        )
      }
    }
  }
  // TODO handle cases where the item doesn't exist
  for (const cap of Capstone.getAll()) {
    const { base, type, count, elongation } = cap.data

    if (base === 2) {
      if (cap.isMono()) {
        g.addEdge("augment", cap, cap.withData({ count: 2, gyrate: "gyro" }), {
          gyrate: "gyro",
          base: 2,
          type: "cupola",
        })
      }
      // short-circuit the other operations for gyrobifastigium
      continue
    }
    if (cap.isMono()) {
      if (cap.isPyramid()) {
        g.addEdge("augment", cap, cap.withData({ count: 2 }), {
          base,
          type: "pyramid",
        })
      } else {
        const bis = Capstone.query.where((data) => {
          return (
            [type, "cupolarotunda"].includes(data.type) &&
            base === data.base &&
            elongation === data.elongation &&
            count === 2
          )
        })
        for (const bi of bis) {
          // TODO handle cupola-rotunda
          g.addEdge("augment", cap, bi, {
            gyrate: bi.data.gyrate,
            base,
            type: bi.data.type as any,
          })
        }
      }
    }

    // Elongate/gyroelongate if not already elongated
    if (cap.isShortened()) {
      g.addEdge("elongate", cap, cap.withData({ elongation: "prism" }))

      if (!(type === "pyramid" && base === 3)) {
        g.addEdge(
          "gyroelongate",
          cap,
          cap.withData({ elongation: "antiprism" }),
          { gyrate: cap.data.gyrate },
        )
      }
    }
    // Elongated caps can be *turned* to gyroelongated caps
    if (cap.isElongated()) {
      if (!(type === "pyramid" && base === 3)) {
        g.addEdge("turn", cap, cap.withData({ elongation: "antiprism" }), {
          gyrate: cap.data.gyrate,
          chiral: true,
        })
      }
    }

    // Gyrate between ortho and gyro cupolae
    if (cap.isBi() && !cap.isPyramid() && cap.data.gyrate !== "gyro") {
      if (cap.isGyroelongated()) {
        // Gyroelongated capstones gyrate to themselves
        g.addEdge("gyrate", cap, cap)
      } else {
        // Ortho-capstones gyrate to gyro-capstones
        g.addEdge("gyrate", cap, cap.withData({ gyrate: "gyro" }))
      }
    }
  }
}
