import { forEach } from "lodash-es"
import { allSolidNames } from "data/common"
import { operations } from ".."
import { Polyhedron } from "math/polyhedra"
import {
  expectValidPolyhedron,
  expectValidAnimationData,
} from "../operationTestUtils"

describe("applyOperation", () => {
  const polyhedra = allSolidNames.map((name) => Polyhedron.get(name))
  forEach(operations, (operation, opName) => {
    describe(opName, () => {
      for (const polyhedron of polyhedra) {
        if (operation.canApplyTo(polyhedron)) {
          it(polyhedron.name, () => {
            for (const options of operation.allOptionCombos(polyhedron)) {
              const result = operation.apply(polyhedron, options as any)
              expectValidPolyhedron(result)
              if (!["augment", "diminish", "gyrate"].includes(opName)) {
                expectValidAnimationData(result, polyhedron)
              }
            }
          })
        }
      }
    })
  })
})
