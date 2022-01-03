import { Capstone } from "specs"
import { makeOpPair } from "../operationPairs"
import { getGeometry } from "../operationUtils"
import { rawTruncate } from "./truncateHelpers"
import { CapstoneForme, fromSpecs } from "math/formes"
import { Face } from "math/polyhedra"
import { CapstoneFace } from "math/formes/FaceType"

export const semisnub = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where((c) => c.isSnub())) {
      // FIXME digonal
      if (entry.isDigonal()) {
        continue
      }
      yield {
        left: entry.withData({ elongation: "antiprism" }),
        right: entry,
      }
    }
  },
  intermediate: "right",
  getPose(forme) {
    return {
      origin: forme.origin(),
      scale: forme.geom.maxRadius(),
      orientation: forme.orientation(),
    }
  },
})

export const rectifyPyramid = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isPyramid() && c.isMono() && c.isShortened(),
    )) {
      yield {
        left: entry,
        right: entry.withData({ elongation: "antiprism", count: 0 }),
      }
    }
  },
  intermediate(entry) {
    return new TruncatedPyramidForme(
      entry.left,
      rawTruncate(getGeometry(entry.left)),
    )
  },
  getPose(forme) {
    return {
      origin: forme.origin(),
      // TODO idk what's the best scale
      scale: forme.geom.maxRadius(),
      orientation: forme.orientation(),
    }
  },
  toLeft: {
    sideFacets: (forme) => forme.geom.vertices,
  },
  toRight: {
    sideFacets: (forme) => [
      forme.ends()[0] as Face,
      ...forme.endBoundaries()[1].adjacentFaces(),
    ],
  },
})

export const rectifyAntiprism = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isAntiprism() && c.isPrimary() && c.isPrismatic(),
    )) {
      yield {
        left: entry,
        right: entry.withData({
          elongation: "none",
          type: "secondary",
          count: 2,
          gyrate: "gyro",
        }),
      }
    }
  },
  intermediate(entry) {
    return new TruncatedAntiprismForme(
      entry.left,
      rawTruncate(getGeometry(entry.left)),
    )
  },
  getPose(forme, $, side) {
    const top = forme.endBoundaries()[0]
    let crossAxis
    switch (side) {
      case "left": {
        crossAxis = top.vertices[0]
        break
      }
      case "intermediate": {
        if (forme.specs.isDigonal()) {
          crossAxis = top.vertices[0]
          break
        }
        crossAxis = top.edges.find((e) => e.twinFace().numSides === 4)!
        break
      }
      case "right": {
        const numSides = forme.specs.isDigonal() ? 3 : 4
        crossAxis = top.edges.find((e) => e.face.numSides === numSides)!
        break
      }
    }
    return {
      origin: forme.origin(),
      scale: forme.geom.maxRadius(),
      orientation: [top, crossAxis],
    }
  },
  toLeft: {
    sideFacets: (forme) => forme.geom.vertices,
  },
  toRight: {
    sideFacets: (forme) => {
      // The digonal truncated faces are triangular; everything else is square
      const numSides = forme.specs.isDigonal() ? 3 : 4
      // Return triangular cap side faces
      return forme
        .endBoundaries()
        .flatMap((b) =>
          b.adjacentFaces().filter((f) => f.numSides === numSides),
        )
    },
    // Explicitly specify the intermediate faces because the angles get mapped incorrectly
    // for pentagonal gyrobicupola
    intermediateFaces: (forme) => {
      const numSides = forme.specs.isDigonal() ? 3 : 4
      return forme.geom.faces.filter((f) => f.numSides === numSides)
    },
  },
})

export const alternate = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isAntiprism() && c.isPrismatic() && c.isPrimary(),
    )) {
      if (entry.isDigonal()) {
        // yield {
        //   left: entry.withData({ elongation: "prism", base: 4 }),
        //   right: entry,
        // }
        continue
      }
      yield {
        left: entry.withData({ elongation: "prism", type: "secondary" }),
        right: entry,
      }
    }
  },
  intermediate(entry) {
    const leftForme = fromSpecs(entry.left)
    return new AlternatePrismForme(
      entry.left,
      rawTruncate(leftForme.geom, getAlternateVertices(leftForme)),
    )
  },
  getPose(forme, $, side) {
    const top = forme.endBoundaries()[0]
    let orientation
    switch (side) {
      case "left": {
        orientation = [top, top.vertices[0]] as const
        break
      }
      case "intermediate": {
        orientation = [
          top,
          top.edges.find((e) => e.twinFace().numSides === 3)!,
        ] as const
        break
      }
      case "right": {
        // if (forme.specs.isDigonal()) {
        //   orientation = [top, top.edges[0].face] as const
        //   break
        // }
        orientation = [top, top.edges[0]] as const
        break
      }
    }
    return {
      origin: forme.origin(),
      scale: forme.geom.maxRadius(),
      orientation,
    }
  },
  toLeft: {
    sideFacets: (forme) => getAlternateVertices(forme),
  },
  toRight: {
    sideFacets: (forme) => forme.sideFaces(),
  },
})

class TruncatedPyramidForme extends CapstoneForme {
  orientation() {
    const top = this.endBoundaries()[0]
    return [top, top.edges.find((e) => e.twinFace().numSides !== 3)!] as const
  }

  *queryTops() {
    yield* this.geom.facesWithNumSides(this.specs.data.base)
  }

  *queryBottoms() {
    yield* this.geom.facesWithNumSides(this.specs.data.base * 2)
  }

  faceAppearance(face: Face) {
    if (this.isEndFace(face)) {
      return CapstoneFace.prismBase(this.specs.data.base, "primary")
    }
    // All untruncated faces are elongations
    if (face.numSides === 3) {
      return CapstoneFace.side(this.specs.data.base, "antiprism")
    }
    // All other faces are side faces
    return CapstoneFace.capSide(
      this.specs.data.base,
      face.vertices.map((v) => {
        return "top"
      }),
    )
  }
}

class TruncatedAntiprismForme extends CapstoneForme {
  *queryTops() {
    if (this.specs.isDigonal()) {
      yield* this.geom.edges.filter(
        (e) => e.face.numSides === 6 && e.twinFace().numSides === 6,
      )
    } else {
      yield* this.geom.facesWithNumSides(this.specs.data.base * 2)
    }
  }
}

class AlternatePrismForme extends CapstoneForme {
  *queryTops() {
    if (this.specs.isPrimary()) {
      yield* this.geom.facesWithNumSides((this.specs.data.base * 3) / 2)
      return
    }
    yield* this.geom.facesWithNumSides(this.specs.data.base * 3)
  }
}

function getAlternateVertices(forme: CapstoneForme) {
  const [top, bottom] = forme.endBoundaries()
  const oppositeVertex = top.edges[0].prev().v1
  const offset = bottom.vertices.indexOf(oppositeVertex) % 2 === 0 ? 0 : 1
  return [
    ...top.vertices.filter((v, i) => i % 2 === 0),
    ...bottom.vertices.filter((v, i) => i % 2 === offset),
  ]
}
