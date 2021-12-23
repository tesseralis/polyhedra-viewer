import { double, halve } from "../doubleHalveOps"
import { validateOpInputs, validateHasOptions } from "../operationTestUtils"

describe("double", () => {
  it("canApplyTo", () => {
    validateOpInputs(double, {
      pass: [
        "square prism",
        "pentagonal antiprism",
        // Make sure it works for tetrahedron
        "digonal antiprism",
        // Make sure it works for composites
        "triaugmented triangular prism",
      ],
      fail: [],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(double, {
      // Only gyroelongated bipyramids need a twist option
      pass: ["gyroelongated square bipyramid"],
      fail: ["gyroelongated pentagonal pyramid"],
    })
  })
})

describe("halve", () => {
  it("canApplyTo", () => {
    validateOpInputs(halve, {
      pass: ["square antiprism", "gyroelongated pentagonal bicupola"],
      fail: [
        // gyroelongated triangular pyramids are invalid
        "gyroelongated triangular cupola",
        "parabiaugmented hexagonal prism",
      ],
    })
  })
})
