import { truncate, rectify } from "../truncate"
import { Polyhedron } from "math/polyhedra"

describe("truncate", () => {
  describe("canApplyTo", () => {
    function expectApplyTo(name: string, value: boolean = true) {
      expect(truncate.canApplyTo(Polyhedron.get(name))).toEqual(value)
    }
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
    function expectApplyTo(name: string, value: boolean = true) {
      expect(rectify.canApplyTo(Polyhedron.get(name))).toEqual(value)
    }
    it("works on regular polyhedra", () => {
      expectApplyTo("tetrahedron")
      expectApplyTo("cube")
      expectApplyTo("icosahedron")
    })
  })
})
