import { expand, snub, contract, dual, twist } from "../resizeOps"
import { makeApplyTo, makeHasOptions } from "../operationTestUtils"

describe("expand", () => {
  describe("canApplyTo", () => {
    const expectApplyTo = makeApplyTo(expand)
    it("works on regular and truncated solids", () => {
      expectApplyTo("cube")
      expectApplyTo("truncated dodecahedron")
    })
  })
})

describe("snub", () => {
  describe("canApplyTo", () => {
    const expectApplyTo = makeApplyTo(snub)
    it("works on regular solids", () => {
      expectApplyTo("cube")
      expectApplyTo("dodecahedron")
      expectApplyTo("truncated dodecahedron", false)
    })
  })

  describe("hasOptions", () => {
    const expectHasOptions = makeHasOptions(snub)

    it("true for all", () => {
      expectHasOptions("cube")
      expectHasOptions("icosahedron")
      expectHasOptions("tetrahedron")
    })
  })
})

describe("dual", () => {
  describe("canApplyTo", () => {
    const expectApplyTo = makeApplyTo(dual)
    it("works on regular solids", () => {
      expectApplyTo("cube")
      expectApplyTo("dodecahedron")
      expectApplyTo("truncated dodecahedron", false)
    })
  })
})

describe("contract", () => {
  const expectApplyTo = makeApplyTo(contract)
  describe("canApplyTo", () => {
    it("works on cantellated polyhedra", () => {
      expectApplyTo("rhombitetratetrahedron")
      expectApplyTo("rhombicuboctahedron")
      expectApplyTo("rhombicosidodecahedron")
    })

    it("works on snub polyhedra", () => {
      expectApplyTo("snub tetratetrahedron")
      expectApplyTo("snub cuboctahedron")
      expectApplyTo("snub icosidodecahedron")
    })

    it("works on bevelled polyhedra", () => {
      expectApplyTo("truncated tetratetrahedron")
      expectApplyTo("truncated cuboctahedron")
      expectApplyTo("truncated icosidodecahedron")
    })
  })
})

describe("twist", () => {
  const expectApplyTo = makeApplyTo(twist)
  const expectHasOptions = makeHasOptions(twist)

  describe("canApplyTo", () => {
    it("works on cantellated and snub polyhedra", () => {
      // cantellated
      expectApplyTo("rhombitetratetrahedron")
      expectApplyTo("rhombicuboctahedron")
      expectApplyTo("rhombicosidodecahedron")

      // snub
      expectApplyTo("snub tetratetrahedron")
      expectApplyTo("snub cuboctahedron")
      expectApplyTo("snub icosidodecahedron")
    })
  })

  describe("hasOptions", () => {
    it("works on cantellated polyhedra", () => {
      expectHasOptions("rhombitetratetrahedron")
      expectHasOptions("rhombicuboctahedron")
      expectHasOptions("rhombicosidodecahedron")

      expectHasOptions("snub tetratetrahedron", false)
      expectHasOptions("snub cuboctahedron", false)
      expectHasOptions("snub icosidodecahedron", false)
    })
  })
})
