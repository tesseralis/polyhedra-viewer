import { PRECISION } from "math/geom"
import { range, set } from "lodash-es"
import { find, getCyclic, repeat } from "lib/utils"
import { Polyhedron, Vertex, VertexArg } from "math/polyhedra"
import Classical, { Operation as OpName } from "specs/Classical"
import { MorphDefinition, makeOpPair } from "../operationPairs"
import { Pose } from "../operationUtils"
import { ClassicalForme } from "math/formes"

interface TrioOpArgs<Op, Opts = any> {
  operation: Op
  transformer: MorphDefinition<ClassicalForme>
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
  const vertexMap: Record<number, number[]> = []
  let newVertices: Vertex[] = []
  let index = 0

  polyhedron.vertices.forEach((v) => {
    const numRepeats = v.adjacentFaces().length
    newVertices = newVertices.concat(repeat(v, numRepeats))
    vertexMap[v.index] = range(index, index + numRepeats)
    index += numRepeats
  })

  return polyhedron.withChanges((solid) => {
    return solid
      .withVertices(newVertices)
      .mapFaces((face) => {
        return face.vertices.flatMap((v) => {
          const faceIndex = v.adjacentFaces().indexOf(face)
          const dupes = vertexMap[v.index]
          return [dupes[faceIndex], getCyclic(dupes, faceIndex - 1)]
        })
      })
      .addFaces(
        polyhedron.vertices.map((v) => {
          return vertexMap[v.index]
        }),
      )
  })
}
