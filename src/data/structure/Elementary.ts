import Structure from "./Structure"
import Queries from "./Queries"
import { DataOptions } from "./common"

type ElementaryBase =
  | "sphenocorona"
  | "augmented sphenocorona"
  | "sphenomegacorona"
  | "hebesphenomegacoron"
  | "disphenocingulum"
  | "bilunabirotunda"
  | "triangular hebesphenorotunda"

interface ElementaryData {
  base: ElementaryBase
}

const options: DataOptions<ElementaryData> = {
  base: [
    "sphenocorona",
    "augmented sphenocorona",
    "sphenomegacorona",
    "hebesphenomegacoron",
    "disphenocingulum",
    "bilunabirotunda",
    "triangular hebesphenorotunda",
  ],
}

export default class Elementary extends Structure<ElementaryData> {
  constructor(data: ElementaryData) {
    super("elementary", data)
  }

  static *getAll() {
    for (const base of options.base) {
      yield new Elementary({ base })
    }
  }

  static query = new Queries(Elementary.getAll())
}
