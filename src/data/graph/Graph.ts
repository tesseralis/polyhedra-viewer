import { uniqBy, isMatch } from "lodash-es"
import { getSingle } from "utils"
import Solid from "../specs/PolyhedronSpecs"
type Operation = string
type SolidName = string

interface GraphOptions {
  facet?: "face" | "vertex"
  base?: 2 | 3 | 4 | 5
  type?: "pyramid" | "cupola" | "rotunda"
  gyrate?: "ortho" | "gyro"
  align?: "meta" | "para"
  direction?: "forward" | "back"
  chiral?: boolean
}

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

interface ResultEntry extends GraphOptions {
  value: SolidName
}

type OperationMap = Map<string, ResultEntry[]>

export default class Graph {
  graph = new Map<string, OperationMap>()

  addDirectedEdge(
    operation: Operation,
    from: Solid,
    to: Solid,
    options?: GraphOptions,
  ) {
    const key = from.canonicalName()
    if (!this.graph.has(key)) {
      this.graph.set(key, new Map())
    }
    const opMap = this.graph.get(key)!
    if (!opMap.has(operation)) {
      opMap.set(operation, [])
    }
    opMap.get(operation)!.push({ value: to.canonicalName(), ...options })
  }

  addEdge(
    operation: Operation,
    from: Solid,
    to: Solid,
    options?: GraphOptions,
  ) {
    this.addDirectedEdge(operation, from, to)
    // TODO make more robust, even though we're guaranteed equality for our use case
    if (from !== to) {
      // TODO gyrate should switch a "forward" argument to "back"
      const inverseOperation = getInverseOperation(operation)
      this.addDirectedEdge(inverseOperation, to, from, options)
    }
  }

  mergeWith(fn: (graph: Graph) => void) {
    fn(this)
    return this
  }

  getPossibleResults(name: SolidName, operation: Operation) {
    const results = this.graph.get(name)?.get(operation) ?? []
    // FIXME switch to a Map implementation of the results so we don't have to do this
    return uniqBy(results, (result) => result.value)
  }

  canApply(name: SolidName, operation: Operation) {
    return this.getPossibleResults(name, operation).length > 0
  }

  getResult(
    name: SolidName,
    operation: Operation,
    filter: Partial<GraphOptions> = {},
  ): SolidName {
    const results = this.getPossibleResults(name, operation)
    if (results.length === 0) {
      throw new Error(
        `Could not find any results for applying ${operation} to ${name}`,
      )
    }
    return getSingle(results.filter((entry) => isMatch(entry, filter))).value
  }
}
