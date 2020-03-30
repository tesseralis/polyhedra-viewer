import { forEach } from "lodash-es"
import { allSolidNames } from "data/common"
import { operations } from ".."
import { Polyhedron } from "math/polyhedra"
import { setupOperations } from "../operationTestUtils"

setupOperations()

describe("applyOperation", () => {
  const polyhedra = allSolidNames.map((name) => Polyhedron.get(name))
  forEach(operations, (operation, opName) => {
    describe(opName, () => {
      for (const polyhedron of polyhedra) {
        if (operation.canApplyTo(polyhedron)) {
          it(polyhedron.name, () => {
            const optsToTest = operation.allOptionCombos(polyhedron)
            optsToTest.forEach((options) => {
              const result = operation.apply(polyhedron, options as any)
              expect(result).toBeValidPolyhedron()
            })
          })
        }
      }
    })
  })
})
