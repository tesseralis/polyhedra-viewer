import Structure from "./Structure"

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

export default class Elementary extends Structure<ElementaryData> {
  constructor(data: ElementaryData) {
    super("elementary", data)
  }
}
