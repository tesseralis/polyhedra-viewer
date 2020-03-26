import { mapValues } from "lodash-es"
import { Graph } from "./Graph"

import Prismatic from "../specs/Prismatic"
import Capstone from "../specs/Capstone"

export default function capstoneGraph(g: Graph) {
  for (const prismatic of Prismatic.getAll()) {
    const { base, type } = prismatic.data

    // Prisms can be turned into antiprisms
    if (prismatic.isPrism()) {
      g.addEdge(
        "turn",
        prismatic,
        Prismatic.query.withData({ base, type: "antiprism" }),
      )
    }
    if (base <= 5) {
      g.addEdge(
        "augment",
        prismatic,
        Capstone.query.withData({
          type: "pyramid",
          count: 1,
          elongation: type,
          base: base as any,
        }),
      )
    } else {
      for (const capType of ["cupola", "rotunda"]) {
        g.addEdge(
          "augment",
          prismatic,
          Capstone.query.withData({
            type: capType as any,
            count: 1,
            elongation: type,
            base: (base / 2) as any,
          }),
        )
      }
    }
  }
  // FIXME can't use getAll because it generates new objects
  // TODO handle cases where the item doesn't exist
  for (const capstone of Capstone.query.where(() => true)) {
    const { base, type, count, elongation, gyrate } = capstone.data
    if (capstone.isMono()) {
      const bis = Capstone.query.where({ base, type, elongation, count: 2 })
      for (const bi of bis) {
        // TODO handle cupola-rotunda
        g.addEdge("augment", capstone, bi)
      }
    }

    // Elongate/gyroelongate if not already elongated
    if (capstone.isShortened()) {
      g.addEdge(
        "elongate",
        capstone,
        Capstone.query.withData({
          base,
          type,
          count,
          gyrate,
          elongation: "prism",
        }),
      )

      g.addEdge(
        "gyroelongate",
        capstone,
        Capstone.query.withData({
          base,
          type,
          count,
          elongation: "antiprism",
        }),
      )
    }
    // Elongated caps can be *twisted* to gyroelongated caps
    if (capstone.isElongated()) {
      g.addEdge(
        "twist",
        capstone,
        Capstone.query.withData({
          base,
          type,
          count,
          elongation: "antiprism",
        }),
      )
    }

    // Gyrate between ortho and gyro cupolae
    if (
      capstone.isBi() &&
      !capstone.isPyramid() &&
      capstone.data.gyrate !== "gyro"
    ) {
      if (capstone.isGyroelongated()) {
        // Gyroelongated capstones gyrate to themselves
        g.addEdge("gyrate", capstone, capstone)
      } else {
        // Ortho-capstones gyrate to gyro-capstones
        g.addEdge(
          "gyrate",
          capstone,
          Capstone.query.withData({
            base,
            type,
            count,
            elongation,
            gyrate: "gyro",
          }),
        )
      }
    }
  }
}
