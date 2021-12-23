import { PRECISION } from "math/geom"
import { range, set } from "lodash-es"
import { find, repeat } from "lib/utils"
import { Polyhedron, VertexArg } from "math/polyhedra"
import Classical, { Operation as OpName } from "specs/Classical"
import { makeOpPair } from "../operationPairs"
import { Pose } from "../operationUtils"
import { ClassicalForme } from "math/formes"

interface TrioOpArgs<Op, Opts = any> {
  operation: Op
  // pose(solid: ClassicalForme, opts: Opts): Pose
  transformer(
    solid: ClassicalForme,
    result: ClassicalForme,
    opts: Opts,
  ): VertexArg[]
  options?(entry: Classical): Opts
}

interface TrioArgs<L, M, R> {
  left: TrioOpArgs<L>
  middle: Omit<TrioOpArgs<M>, "transformer">
  right: TrioOpArgs<R>
}

/**
 * Create a trio of truncation OpPairs: truncate, pare, and rectify.
 * Given the functions to use for operations, poses, and transformers,
 * generate the triplet of OpPairs to use.
 */
export function makeTruncateTrio<
  L extends OpName,
  M extends OpName,
  R extends OpName
>(
  getPose: (forme: ClassicalForme, options: any) => Pose,
  args: TrioArgs<L, M, R>,
) {
  const { left, right, middle } = args
  function makePair(leftOp: "left" | "middle", rightOp: "middle" | "right") {
    // Choose which side is the "middle" in order to short-circuit getting the intermediate
    const middleArg =
      leftOp === "middle" ? "left" : rightOp === "middle" ? "right" : null

    return makeOpPair({
      graph: function* () {
        for (const entry of Classical.allWithOperation(middle.operation)) {
          yield {
            left: entry.withOperation(args[leftOp].operation),
            right: entry.withOperation(args[rightOp].operation),
            options: {
              left: args[leftOp].options?.(entry),
              right: args[rightOp].options?.(entry),
            },
          }
        }
      },
      // If this is the left-right operation, then the intermediate
      // is going to be the middle operation
      intermediate:
        middleArg ??
        ((entry) => (entry.left as any).withOperation(middle.operation)),
      getPose,
      toLeft: leftOp === "left" ? left.transformer : undefined,
      toRight: rightOp === "right" ? right.transformer : undefined,
    })
  }

  return {
    truncate: makePair("left", "middle"),
    pare: makePair("middle", "right"),
    rectify: makePair("left", "right"),
  }
}

// Perform a raw, geometric truncation on the given polyhedral geometry
export function rawTruncate(polyhedron: Polyhedron) {
  const truncateLength = getTruncateLength(polyhedron)
  const oldSideLength = polyhedron.edgeLength()
  const truncateScale = (oldSideLength - truncateLength) / 2 / oldSideLength
  const duplicated = duplicateVertices(polyhedron)
  const transform = (v: any) => v

  const truncatedVertices = duplicated.vertices.map((vertex) => {
    const adjacentVertices = vertex.adjacentVertices()
    const v = vertex.vec
    const v1 = find(
      adjacentVertices,
      (adj) => adj.vec.distanceTo(v) > PRECISION,
    )
    const truncated = v
      .clone()
      .add(v1.vec.clone().sub(v).multiplyScalar(truncateScale))
    return !!transform ? transform(truncated) : truncated
  })
  return duplicated.withVertices(truncatedVertices)
}

function getTruncateLength(polyhedron: Polyhedron) {
  const face = polyhedron.smallestFace()
  const n = face.numSides
  const theta = Math.PI / n
  const newTheta = theta / 2
  return 2 * face.apothem() * Math.tan(newTheta)
}

function duplicateVertices(polyhedron: Polyhedron) {
  const mapping: NestedRecord<number, number, number> = {}
  const count = polyhedron.getVertex().adjacentFaces().length
  polyhedron.vertices.forEach((v) => {
    v.adjacentFaces().forEach((face, i) => {
      set(mapping, [face.index, v.index], i)
    })
  })

  return polyhedron.withChanges((solid) => {
    return solid
      .withVertices(
        polyhedron.vertices.flatMap((v) =>
          repeat(v.vec, v.adjacentFaces().length),
        ),
      )
      .mapFaces((face) => {
        return face.vertices.flatMap((v) => {
          // FIXME oh god this needs to be mapped better
          const base = count * v.index
          const j = mapping[face.index][v.index]
          return [base + ((j + 1) % count), base + j]
        })
      })
      .addFaces(
        polyhedron.vertices.map((v) => {
          const count = v.adjacentFaces().length
          return range(v.index * count, (v.index + 1) * count)
        }),
      )
  })
}
