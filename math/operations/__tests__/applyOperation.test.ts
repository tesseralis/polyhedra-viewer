import { forEach } from "lodash-es"
import { fromSpecs } from "math/formes"
import { operations } from ".."
import { validateOperationApplication } from "../operationTestUtils"

const naughtyList = [
  // .allOptionCombos() doesn't know how to treat the fact that the hexagonal prism
  // needs a pyramid in some places but a capstone in others.
  ["augment", "hexagonal prism"],
  // This is a degenerate form that I haven't gotten around
  ["diminish", "gyrate diminished rhombicuboctahedron"],
  ["gyrate", "gyrate diminished rhombicuboctahedron"],
]

function shouldSkip(opName: string, solid: string) {
  return naughtyList.some(
    ([naughtyOp, naughtySolid]) =>
      opName === naughtyOp && solid === naughtySolid,
  )
}

describe("applyOperation", () => {
  forEach(operations, (operation, opName) => {
    describe(opName, () => {
      // TODO determine solid names from the graph instead
      for (const specs of operation.allInputs()) {
        const polyhedron = fromSpecs(specs)
        if (operation.canApplyTo(polyhedron)) {
          const fn = shouldSkip(opName, specs.name()) ? it.skip : it
          fn(polyhedron.specs.name(), () => {
            for (const options of operation.allOptionCombos(polyhedron)) {
              validateOperationApplication(operation, polyhedron, options)
            }
          })
        }
      }
    })
  })
})