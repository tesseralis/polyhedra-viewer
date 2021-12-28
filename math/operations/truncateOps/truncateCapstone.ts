import { Capstone } from "specs"
import { makeOpPair } from "../operationPairs"
import { getGeometry } from "../operationUtils"
import { rawTruncate } from "./truncateHelpers"
import { CapstoneForme, fromSpecs } from "math/formes"
import { Face } from "math/polyhedra"
import { CapstoneFace } from "math/formes/FaceType"

export const rectify = makeOpPair<Capstone>({
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
      scale: Math.max(...forme.geom.vertices.map((v) => v.distanceToCenter())),
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

export const alternate = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isAntiprism() && c.isPrismatic() && c.isPrimary(),
    )) {
      if (entry.isDigonal()) {
        yield {
          left: entry.withData({ elongation: "prism", base: 4 }),
          right: entry,
        }
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
        if (forme.specs.isDigonal()) {
          orientation = [top, top.edges[0].face] as const
          break
        }
        orientation = [top, top.edges[0]] as const
        break
      }
    }
    return {
      origin: forme.origin(),
      scale: Math.max(...forme.geom.vertices.map((v) => v.distanceToCenter())),
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

class AlternatePrismForme extends CapstoneForme {
  *queryTops() {
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
