import { twist } from "../twist"
import { Polyhedron } from "math/polyhedra"

function expectApplyTo(name: string, value: boolean = true) {
  expect(twist.canApplyTo(Polyhedron.get(name))).toEqual(value)
}

function expectHasOptions(name: string, value: boolean = true) {
  expect(twist.hasOptions(Polyhedron.get(name))).toEqual(value)
}

describe("twist", () => {
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
