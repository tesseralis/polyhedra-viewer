import { pickBy, isMatch } from "lodash-es"
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
  if (["elongate", "gyroelongate"].includes(operation)) {
    return "shorten"
  }
  if (operation === "augment") return "diminish"
  throw new Error(`Invalid operation name: ${operation}`)
}

type ResultEntries = Map<string, GraphOptions>

type OperationMap = Map<string, ResultEntries>

export default class Graph {
  graph = new Map<string, OperationMap>()

  addDirectedEdge(
    operation: Operation,
    from: Solid,
    to: Solid,
    options?: GraphOptions,
  ) {
    const fromName = from.canonicalName()
    const toName = to.canonicalName()

    if (!this.graph.has(fromName)) {
      this.graph.set(fromName, new Map())
    }
    const opMap = this.graph.get(fromName)!
    if (!opMap.has(operation)) {
      opMap.set(operation, new Map())
    }
    const resultEntries = opMap.get(operation)!
    if (resultEntries.has(toName)) {
      resultEntries.set(toName, options ?? {})
    } else {
      const newEntry = { ...resultEntries.get(toName), ...options }
      resultEntries.set(toName, newEntry)
    }
    // opMap.get(operation)!.push({ value: to.canonicalName(), ...options })
  }

  addEdge(
    operation: Operation,
    from: Solid,
    to: Solid,
    options?: GraphOptions,
  ) {
    this.addDirectedEdge(operation, from, to, options)
    // TODO make more robust, even though we're guaranteed equality for our use case
    if (from !== to) {
      // TODO gyrate should switch a "forward" argument to "back"
      const inverseOperation = getInverseOperation(operation)
      if (operation === "gyrate" && options?.direction === "back") {
        options.direction = "forward"
      }
      this.addDirectedEdge(inverseOperation, to, from, options)
    }
  }

  mergeWith(fn: (graph: Graph) => void) {
    fn(this)
    return this
  }

  getPossibleResults(name: SolidName, operation: Operation) {
    const results = this.graph.get(name)?.get(operation) ?? new Map()
    return [...results].map(([value, options]) => ({ value, ...options }))
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
    return getSingle(results.filter((entry) => isMatch(entry, pickBy(filter))))
      .value
  }
}
