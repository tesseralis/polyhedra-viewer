import { Capstone, FacetType, twists, oppositeTwist } from "specs"
import { makeOpPair, OpPairInput, GraphOpts } from "../operationPairs"
import {
  getTransformedVertices,
  FacetOpts,
  TwistOpts,
  Pose,
} from "../operationUtils"
import { CapstoneForme, fromSpecs } from "math/formes"

/**
 * Return the expanded vertices of the polyhedron resized to the given distance-from-center
 * and rotated by the given angle
 *
 * @param faces the faces to transform
 * @param distance the normalized distance from center to put those faces
 * @param angle the angle to twist the faces by
 */
function getResizedVertices(
  forme: CapstoneForme,
  facet: FacetType,
  result: CapstoneForme,
): any {
  throw new Error("not implemented")
  // const resultForme = fromSpecs(result)
  // const angle = forme.snubAngle(facet)
  // const distance = resultForme.inradius(facet) / resultForme.geom.edgeLength()
  // const scale = forme.geom.edgeLength() * distance - forme.inradius(facet)
  // return getTransformedVertices(forme.facetFaces(facet), (f) => {
  //   const rotateM = f.rotateNormal(angle)
  //   const translateM = f.translateNormal(scale)
  //   return f.withCentroidOrigin(rotateM.premultiply(translateM))
  // })
}

function getCapstonePose(forme: CapstoneForme): Pose {
  const { geom } = forme
  const top = forme.ends()[0]
  return {
    // Always centered on centroid
    origin: geom.centroid(),
    // Use the normal of the given face as the first axis
    scale: geom.edgeLength(),
    // FIXME get the cross axis correct
    orientation: [top, top.centroid()],
  }
}

type ResizeArgs<L, R> = Omit<OpPairInput<Capstone, L, R>, "graph">

function getResizeArgs<L, R>(
  getFacet: (opts: GraphOpts<L, R>) => FacetType,
): ResizeArgs<L, R> {
  return {
    middle: "right",
    getPose(forme) {
      return getCapstonePose(forme)
    },
    toLeft(forme, options, result) {
      return getResizedVertices(forme, getFacet(options), result)
    },
  }
}

const resizeArgs = getResizeArgs<{}, FacetOpts>((opts) => opts.right.facet)

export const expand = makeOpPair<Capstone, {}, FacetOpts>({
  ...resizeArgs,
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isPyramid() && c.isMono() && c.isShortened(),
    )) {
      yield {
        left: entry,
        right: entry.withData({ type: "secondary", count: 2, gyrate: "gyro" }),
      }
    }
  },
})

export const snub = makeOpPair<Capstone, TwistOpts, FacetOpts>({
  ...resizeArgs,
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) =>
        c.isPyramid() && c.isMono() && c.isShortened() && !c.isPentagonal(),
    )) {
      yield {
        left: entry,
        right: entry.withData({ elongation: "snub" }),
      }
    }
  },
})

export const twist = makeOpPair<Capstone, TwistOpts, {}>({
  ...getResizeArgs(() => "face"),
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isCupola() && c.isBi() && c.isShortened() && !c.isPentagonal(),
    )) {
      yield {
        left: entry,
        right: entry.withData({ elongation: "snub" }),
      }
    }
  },
})
