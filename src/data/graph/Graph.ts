import Solid from "../specs/PolyhedronSpecs"
type Operation = string
type SolidName = string

export interface Graph {
  addEdge(operation: Operation, from: Solid, to: Solid): void
  getResult(name: SolidName, operation: Operation): SolidName
}
