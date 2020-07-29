import { truncate, rectify, sharpen } from "../truncateOps"
import { makeApplyTo, makeHasOptions } from "../operationTestUtils"

describe("truncate", () => {
  describe("canApplyTo", () => {
    const expectApplyTo = makeApplyTo(truncate)
    it("works on regular and rectified polyhedra", () => {
      expectApplyTo("tetrahedron")
      expectApplyTo("cube")
      expectApplyTo("icosahedron")

      expectApplyTo("cuboctahedron")
      expectApplyTo("icosidodecahedron")
    })
  })
})

describe("rectify", () => {
  describe("canApplyTo", () => {
    const expectApplyTo = makeApplyTo(rectify)
    it("works on regular polyhedra", () => {
      expectApplyTo("tetrahedron")
      expectApplyTo("cube")
      expectApplyTo("icosahedron")
    })

    it("works on quasiregular polyhedra", () => {
      expectApplyTo("cuboctahedron")
      expectApplyTo("icosidodecahedron")
    })
  })
})

describe("sharpen", () => {
  const expectApplyTo = makeApplyTo(sharpen)
  const expectHasOptions = makeHasOptions(sharpen)

  describe("canApplyTo", () => {
    it("works on truncated polyhedra", () => {
      expectApplyTo("truncated tetrahedron")
      expectApplyTo("truncated cube")
      expectApplyTo("truncated icosahedron")
    })

    it("works on bevelled polyhedra", () => {
      expectApplyTo("truncated cuboctahedron")
      expectApplyTo("truncated icosidodecahedron")
    })

    it("works on rectified polyhedra", () => {
      expectApplyTo("tetratetrahedron")
      expectApplyTo("cuboctahedron")
      expectApplyTo("icosidodecahedron")
    })

    it("works on cantellated polyhera", () => {
      expectApplyTo("rhombicuboctahedron")
      expectApplyTo("rhombicosidodecahedron")
    })
  })

  describe("hasOptions", () => {
    it("is true only on rectified", () => {
      expectHasOptions("cuboctahedron")
      expectHasOptions("icosidodecahedron")

      expectHasOptions("truncated tetratetrahedron", false)
      expectHasOptions("truncated cuboctahedron", false)
      expectHasOptions("truncated icosahedron", false)
    })
  })
})
