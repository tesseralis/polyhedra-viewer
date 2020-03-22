import Structure from "./Structure"
import Prismatic from "./Prismatic"

interface Data {
  base: Prismatic
  operation: null | "rectify" | "snub"
}

export default class ModifiedAntiprism extends Structure {
  data: Data
  constructor(data: Data) {
    super("modified antiprism")
    this.data = data
  }
}
