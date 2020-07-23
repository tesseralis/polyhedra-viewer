import { forEach } from "lodash-es"
import { allSolidNames } from "data/common"
import { operations } from ".."
import { Polyhedron } from "math/polyhedra"
import { validateOperationApplication } from "../operationTestUtils"

describe("applyOperation", () => {
  const polyhedra = allSolidNames.map((name) => Polyhedron.get(name))
  forEach(operations, (operation, opName) => {
    describe(opName, () => {
      for (const polyhedron of polyhedra) {
        if (operation.canApplyTo(polyhedron)) {
          it(polyhedron.name, () => {
            for (const options of operation.allOptionCombos(polyhedron)) {
              validateOperationApplication(operation, polyhedron, options)
            }
          })
        }
      }
    })
  })
})
