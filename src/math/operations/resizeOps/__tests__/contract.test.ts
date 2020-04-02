import { contract } from "../contract"
import { Polyhedron } from "math/polyhedra"

function expectApplyTo(name: string, value: boolean = true) {
  expect(contract.canApplyTo(Polyhedron.get(name))).toEqual(value)
}

describe("contract", () => {
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
