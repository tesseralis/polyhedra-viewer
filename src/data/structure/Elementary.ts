import Structure from "./Structure"

type ElementaryBase =
  | "sphenocorona"
  | "sphenomegacorona"
  | "hebesphenomegacoron"
  | "disphenocingulum"
  | "bilunabirotunda"
  | "triangular hebesphenorotunda"

interface Data {
  base: ElementaryBase
  augmented?: boolean
}

export default class Elementary extends Structure {
  data: Data

  constructor(data: Data) {
    super("elementary")
    this.data = data
  }
}
