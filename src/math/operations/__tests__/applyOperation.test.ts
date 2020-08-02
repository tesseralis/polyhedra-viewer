import { forEach } from "lodash-es"
import { allSolidNames } from "data/common"
import { getCanonicalSpecs } from "specs"
import createForme from "math/formes/createForme"
import { getGeometry } from "math/operations/operationUtils"
import { operations } from ".."
import { validateOperationApplication } from "../operationTestUtils"

describe("applyOperation", () => {
  // FIXME this needs to look at all alternates too
  const polyhedra = allSolidNames.map((name) => {
    const specs = getCanonicalSpecs(name)
    // FIXME create forme from specs
    return createForme(specs, getGeometry(specs))
  })

  forEach(operations, (operation, opName) => {
    describe(opName, () => {
      // TODO determine solid names from the graph instead
      for (const polyhedron of polyhedra) {
        if (operation.canApplyTo(polyhedron)) {
          it(polyhedron.specs.name(), () => {
            for (const options of operation.allOptionCombos(polyhedron)) {
              validateOperationApplication(operation, polyhedron, options)
            }
          })
        }
      }
    })
  })
})
