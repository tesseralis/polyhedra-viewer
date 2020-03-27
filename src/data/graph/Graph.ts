import { getSingle } from "utils"
import Solid from "../specs/PolyhedronSpecs"
type Operation = string
type SolidName = string

function getInverseOperation(operation: string) {
  if (["dual", "gyrate", "twist", "turn"].includes(operation)) {
    return operation
  }
  if (["truncate", "rectify"].includes(operation)) {
    return "sharpen"
  }
  if (["expand", "snub"].includes(operation)) {
    return "contract"
  }
  if (["elongate", "gyroelongate".includes(operation)]) {
    return "contract"
  }
  if (operation === "augment") return "diminish"
  throw new Error(`Invalid operation name: ${operation}`)
}

type OperationMap = Map<string, Solid[]>

export default class Graph {
  graph = new Map<string, OperationMap>()

  addDirectedEdge(operation: Operation, from: Solid, to: Solid) {
    const key = from.canonicalName()
    if (!this.graph.has(key)) {
      this.graph.set(key, new Map())
    }
    const opMap = this.graph.get(key)!
    if (!opMap.has(operation)) {
      opMap.set(operation, [])
    }
    opMap.get(operation)!.push(to)

    throw new Error("Not implemented yet")
  }

  addEdge(operation: Operation, from: Solid, to: Solid) {
    this.addDirectedEdge(operation, from, to)
    // TODO make more robust, even though we're guaranteed equality for our use case
    if (from !== to) {
      const inverseOperation = getInverseOperation(operation)
      this.addDirectedEdge(inverseOperation, to, from)
    }
  }

  apply(fn: (graph: Graph) => void) {
    fn(this)
    return this
  }

  getResult(
    name: SolidName,
    operation: Operation,
    filter: (result: Solid) => boolean,
  ): SolidName {
    const results = this.graph.get(name)?.get(operation)
    if (!results) {
      throw new Error(
        `Could not find any results for appyling ${operation} to ${name}`,
      )
    }
    return getSingle(results.filter(filter)).canonicalName()
  }
}
