import { truncate, rectify, sharpen, unrectify } from "../truncateOps"
import { validateOpInputs, validateHasOptions } from "../operationTestUtils"

describe("truncate", () => {
  it("canApplyTo", () => {
    validateOpInputs(truncate, {
      pass: [
        "tetrahedron",
        "cube",
        "icosahedron",
        // rectified polyhedra
        "cuboctahedron",
        "icosidodecahedron",
      ],
      fail: [],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(truncate, {
      pass: [],
      fail: ["tetrahedron", "icosahedron", "cuboctahedron"],
    })
  })
})

describe("rectify", () => {
  it("canApplyTo", () => {
    validateOpInputs(rectify, {
      pass: [
        "tetrahedron",
        "cube",
        "icosahedron",
        // rectified polyhedra
        "cuboctahedron",
        "icosidodecahedron",
      ],
      fail: [],
    })
  })
})

describe("sharpen", () => {
  it("canApplyTo", () => {
    validateOpInputs(sharpen, {
      pass: [
        // truncated solids
        "truncated tetrahedron",
        "truncated cube",
        "truncated icosahedron",
        // bevelled solids
        "truncated cuboctahedron",
        "truncated icosidodecahedron",
      ],
      fail: [],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(sharpen, {
      pass: [],
      fail: [
        "truncated tetratetrahedron",
        "truncated cuboctahedron",
        "truncated icosahedron",
      ],
    })
  })
})

describe("unrectify", () => {
  it("canApplyTo", () => {
    validateOpInputs(unrectify, {
      pass: [
        "cuboctahedron",
        "icosidodecahedron",
        "rhombicuboctahedron",
        "rhombicosidodecahedron",
        "snub cuboctahedron",
        "snub icosidodecahedron",
      ],
      fail: [],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(unrectify, {
      pass: ["cuboctahedron", "icosidodecahedron"],
      fail: [
        "rhombicuboctahedron",
        "rhombicosidodecahedron",
        "snub cuboctahedron",
        "snub icosidodecahedron",
      ],
    })
  })
})
