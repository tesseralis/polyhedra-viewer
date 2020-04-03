import { sharpen } from "../sharpen"
import { Polyhedron } from "math/polyhedra"

function expectApplyTo(name: string, value: boolean = true) {
  expect(sharpen.canApplyTo(Polyhedron.get(name))).toEqual(value)
}

function expectHasOptions(name: string, value: boolean = true) {
  expect(sharpen.hasOptions(Polyhedron.get(name))).toEqual(value)
}

describe("sharpen", () => {
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
      expectApplyTo("octahedron")
      expectApplyTo("cuboctahedron")
      expectApplyTo("icosidodecahedron")
    })
  })

  describe("hasOptions", () => {
    it("is true only on rectified", () => {
      expectHasOptions("cuboctahedron")
      expectHasOptions("icosidodecahedron")

      expectHasOptions("octahedron", false)
      expectHasOptions("truncated cuboctahedron", false)
      expectHasOptions("truncated icosahedron", false)
    })
  })
})
