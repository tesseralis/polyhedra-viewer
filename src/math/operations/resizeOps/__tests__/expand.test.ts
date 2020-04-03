import { expand, snub, dual } from "../expand"
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
