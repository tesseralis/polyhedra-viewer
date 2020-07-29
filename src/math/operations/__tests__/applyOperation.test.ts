import { forEach } from "lodash-es"
import { allSolidNames } from "data/common"
import { operations } from ".."
import getSpecs from "data/specs/getSpecs"
import { validateOperationApplication } from "../operationTestUtils"
import { getGeometry } from "math/operations/operationUtils"

const badOptions: any = {
  // These appear in two "sequences": capstone and augmented
  augment: ["triangular prism", "pentagonal prism", "hexagonal prism"],
  // This tries to apply to *all* caps, not just the bases
  diminish: ["gyroelongated pentagonal pyramid"],
}

describe("applyOperation", () => {
  // FIXME this needs to look at all alternates too
  const polyhedra = allSolidNames.map((name) => {
    const specs = getSpecs(name)
    return {
      specs,
      geom: getGeometry(specs),
    }
  })

  forEach(operations, (operation, opName) => {
    describe(opName, () => {
      for (const polyhedron of polyhedra) {
        if (
          operation.canApplyTo(polyhedron) &&
          !badOptions[opName]?.includes?.(polyhedron.geom.name)
        ) {
          it(polyhedron.geom.name, () => {
            for (const options of operation.allOptionCombos(polyhedron)) {
              validateOperationApplication(operation, polyhedron, options)
            }
          })
        }
      }
    })
  })
})
