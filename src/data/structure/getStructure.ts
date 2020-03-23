import Exceptional from "./Exceptional"
import Prismatic from "./Prismatic"
import Capstone from "./Capstone"
import Composite from "./Composite"
import ModifiedAntiprism from "./ModifiedAntiprism"
import Elementary from "./Elementary"

const subclasses = [
  Exceptional,
  Prismatic,
  Capstone,
  Composite,
  ModifiedAntiprism,
  Elementary,
]

export default function getStructure(name: string) {
  for (const Subclass of subclasses) {
    if (Subclass.query.hasName(name)) {
      return Subclass.query.withName(name)
    }
  }
  throw new Error(`Could not find structure with canonical name ${name}`)
}
