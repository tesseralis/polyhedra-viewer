import Classical from "./Classical"
import Capstone from "./Capstone"
import Composite from "./Composite"
import ModifiedAntiprism from "./ModifiedAntiprism"
import Elementary from "./Elementary"

const subclasses = [
  Classical,
  Capstone,
  Composite,
  ModifiedAntiprism,
  Elementary,
]

export default function getSpecs(name: string) {
  for (const Subclass of subclasses) {
    if (Subclass.query.hasName(name)) {
      return Subclass.query.withName(name)
    }
  }
  throw new Error(`Could not find structure with canonical name ${name}`)
}

export function getSpecs2(name: string) {
  for (const Subclass of subclasses) {
    if (Subclass.query.hasName2(name)) {
      return Subclass.query.withName2(name)
    }
  }
  throw new Error(`Could not find structure with name ${name}`)
}

export function* getAllSpecs(name: string) {
  for (const Subclass of subclasses) {
    if (Subclass.query.hasName(name)) {
      yield* Subclass.query.allWithName(name)
    }
  }
}
