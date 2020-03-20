type Operation = string
type SolidName = string

type Item = {}

export interface Graph {
  addEdge(operation: Operation, from: Item, to: Item): void
  getResult(name: SolidName, operation: Operation): SolidName
}
