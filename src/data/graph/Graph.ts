// TODO consolidate these typings
interface Options {
  // augment
  gyrate?: "ortho" | "gyro"
  align?: "meta" | "para"
  capType?: "pyramid" | "cupola" | "rotunda"
  base?: 2 | 3 | 4 | 5
  // gyrate
  direction?: "forward" | "back"
  // twist
  chiral?: boolean
  // contraction
  facet?: "face" | "vertex"
}

type Operation = string
type SolidName = string

interface Edge {
  operation: Operation
  from: SolidName
  to: SolidName
  options?: Options
}

export interface Graph {
  addEdge(edge: Edge): void
  getResult(name: SolidName, operation: Operation): SolidName
}
