import { forEach } from "lodash-es"
import { allSolidNames } from "data/common"
import { operations } from ".."
import getSpecs from "data/specs/getSpecs"
import { validateOperationApplication } from "../operationTestUtils"
import { getGeometry } from "math/operations/operationUtils"

const goodOperations = [
  "truncate",
  "rectify",
  "sharpen",
  "dual",
  "expand",
  "snub",
  "contract",
  "twist",
  "elongate",
  "gyroelongate",
  "contract",
  "turn",
  // "augment",
  // "diminish",
  "gyrate",
]

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
    if (!goodOperations.includes(opName)) return
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
