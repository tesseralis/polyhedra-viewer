import { forEach } from "lodash-es"
import { allSolidNames } from "data/common"
import { operations } from ".."
import { Polyhedron } from "math/polyhedra"
import getSpecs from "data/specs/getSpecs"
import { validateOperationApplication } from "../operationTestUtils"

describe("applyOperation", () => {
  const polyhedra = allSolidNames.map((name) => ({
    geom: Polyhedron.get(name),
    specs: getSpecs(name),
  }))

  forEach(operations, (operation, opName) => {
    describe(opName, () => {
      for (const polyhedron of polyhedra) {
        if (operation.canApplyTo(polyhedron)) {
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
