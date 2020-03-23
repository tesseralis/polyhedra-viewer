import Structure from "./Structure"
import Prismatic from "./Prismatic"
import { DataOptions } from "./common"

interface ModifiedAntiprismData {
  base: Prismatic
  operation: null | "rectified" | "snub"
}

const options: DataOptions<ModifiedAntiprismData> = {
  // FIXME we only want to filter it so that only antiprisms n<5 are counted
  base: [...Prismatic.getAll()],
  operation: [null, "rectified", "snub"],
}

export default class ModifiedAntiprism extends Structure<
  ModifiedAntiprismData
> {
  constructor(data: ModifiedAntiprismData) {
    super("modified antiprism", data)
  }

  static *getAll() {
    for (const base of options.base) {
      for (const operation of options.operation) {
        // The snub pentagonal antiprism is non-CRF
        if (base.data.base === 5 && operation === "snub") {
          continue
        }
        yield new ModifiedAntiprism({ base, operation })
      }
    }
  }
}
