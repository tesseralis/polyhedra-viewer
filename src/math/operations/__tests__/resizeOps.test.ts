import { expand, snub, contract, dual, twist } from "../resizeOps"
import { Polyhedron } from "math/polyhedra"

describe("expand", () => {
  describe("canApplyTo", () => {
    function expectApplyTo(name: string, value: boolean = true) {
      expect(expand.canApplyTo(Polyhedron.get(name))).toEqual(value)
    }
    it("works on regular and truncated solids", () => {
      expectApplyTo("cube")
      expectApplyTo("truncated dodecahedron")
    })
  })
})

describe("snub", () => {
  describe("canApplyTo", () => {
    function expectApplyTo(name: string, value: boolean = true) {
      expect(snub.canApplyTo(Polyhedron.get(name))).toEqual(value)
    }
    it("works on regular solids", () => {
      expectApplyTo("cube")
      expectApplyTo("dodecahedron")
      expectApplyTo("truncated dodecahedron", false)
    })
  })

  describe("hasOptions", () => {
    function expectHasOptions(name: string, value: boolean = true) {
      expect(snub.hasOptions(Polyhedron.get(name))).toEqual(value)
    }

    it("true if not tetrahedron", () => {
      expectHasOptions("cube")
      expectHasOptions("icosahedron")
      expectHasOptions("tetrahedron", false)
    })
  })
})

describe("dual", () => {
  describe("canApplyTo", () => {
    function expectApplyTo(name: string, value: boolean = true) {
      expect(dual.canApplyTo(Polyhedron.get(name))).toEqual(value)
    }
    it("works on regular solids", () => {
      expectApplyTo("cube")
      expectApplyTo("dodecahedron")
      expectApplyTo("truncated dodecahedron", false)
    })
  })
})

describe("contract", () => {
  function expectApplyTo(name: string, value: boolean = true) {
    expect(contract.canApplyTo(Polyhedron.get(name))).toEqual(value)
  }
  describe("canApplyTo", () => {
    it("works on cantellated polyhedra", () => {
      expectApplyTo("cuboctahedron")
      expectApplyTo("rhombicuboctahedron")
      expectApplyTo("rhombicosidodecahedron")
    })

    it("works on snub polyhedra", () => {
      expectApplyTo("icosahedron")
      expectApplyTo("snub cube")
      expectApplyTo("snub dodecahedron")
    })

    it("works on bevelled polyhedra", () => {
      expectApplyTo("truncated octahedron")
      expectApplyTo("truncated cuboctahedron")
      expectApplyTo("truncated icosidodecahedron")
    })
  })
})

describe("twist", () => {
  function expectApplyTo(name: string, value: boolean = true) {
    expect(twist.canApplyTo(Polyhedron.get(name))).toEqual(value)
  }

  function expectHasOptions(name: string, value: boolean = true) {
    expect(twist.hasOptions(Polyhedron.get(name))).toEqual(value)
  }
  describe("canApplyTo", () => {
    it("works on cantellated and snub polyhedra", () => {
      // cantellated
      expectApplyTo("cuboctahedron")
      expectApplyTo("rhombicuboctahedron")
      expectApplyTo("rhombicosidodecahedron")

      // snub
      expectApplyTo("icosahedron")
      expectApplyTo("snub cube")
      expectApplyTo("snub dodecahedron")
    })
  })

  describe("hasOptions", () => {
    it("works on cantellated polyhedra", () => {
      expectHasOptions("rhombicuboctahedron")
      expectHasOptions("rhombicosidodecahedron")

      expectHasOptions("cuboctahedron", false)
      expectHasOptions("icosahedron", false)
      expectHasOptions("snub cube", false)
      expectHasOptions("snub dodecahedron", false)
    })
  })
})
