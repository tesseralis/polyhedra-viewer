import Structure from "./Structure"
import Prismatic from "./Prismatic"

interface ModifiedAntiprismData {
  base: Prismatic
  operation: null | "rectify" | "snub"
}

export default class ModifiedAntiprism extends Structure<
  ModifiedAntiprismData
> {
  constructor(data: ModifiedAntiprismData) {
    super("modified antiprism", data)
  }
}
