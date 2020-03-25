import Structure from "./Structure"
import Queries from "./Queries"
import Prismatic from "./Prismatic"
import { DataOptions } from "./common"

interface ModifiedAntiprismData {
  source: Prismatic
  // operation: null | "rectified" | "snub"
  operation: null | "snub"
}

const options: DataOptions<ModifiedAntiprismData> = {
  source: Prismatic.query.where(
    ({ base, type }) => type === "antiprism" && base <= 5,
  ),
  operation: [null, "snub"],
}

export default class ModifiedAntiprism extends Structure<
  ModifiedAntiprismData
> {
  constructor(data: ModifiedAntiprismData) {
    super("modified antiprism", data)
  }

  static *getAll() {
    for (const source of options.source) {
      for (const operation of options.operation) {
        // The snub pentagonal antiprism is non-CRF
        if (source.data.base === 5 && operation === "snub") {
          continue
        }
        yield new ModifiedAntiprism({ source, operation })
      }
    }
  }

  static query = new Queries(ModifiedAntiprism.getAll())
}
