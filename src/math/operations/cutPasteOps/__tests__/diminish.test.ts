import { diminish } from "../diminish"
import { Polyhedron } from "math/polyhedra"

function expectApplyTo(name: string, value: boolean = true) {
  expect(diminish.canApplyTo(Polyhedron.get(name))).toEqual(value)
}

describe("diminish", () => {
  describe("canApplyTo", () => {
    it("works on capstones", () => {
      // single capstones can't be diminished
      expectApplyTo("square pyramid", false)
      expectApplyTo("triangular cupola", false)
      expectApplyTo("pentagonal rotunda", false)

      // all other capstones can be diminished
      expectApplyTo("elongated square pyramid")
      expectApplyTo("gyroelongated triangular cupola")
      expectApplyTo("pentagonal orthobirotunda")
      expectApplyTo("gyroelongated pentagonal cupolarotunda")
    })

    it("works on augmented composites", () => {
      // valid on everything
      expectApplyTo("augmented pentagonal prism")
      expectApplyTo("parabiaugmented hexagonal prism")
      expectApplyTo("triaugmented dodecahedron")

      // false on the sources
      expectApplyTo("hexagonal prism", false)
      expectApplyTo("cube", false)
      expectApplyTo("truncated tetrahedron", false)
    })

    it("works on diminished icosahedra", () => {
      expectApplyTo("icosahedron")
      expectApplyTo("metabidiminished icosahedron")
      expectApplyTo("augmented tridiminished icosahedron")

      // false cases
      expectApplyTo("tridiminished icosahedron", false)
      expectApplyTo("pentagonal antiprism", false)
    })

    it("works on rhombicosidodecahedra", () => {
      expectApplyTo("rhombicosidodecahedron")
      expectApplyTo("trigyrate rhombicosidodecahedron")
      expectApplyTo("metabidiminished rhombicosidodecahedron")
      expectApplyTo("paragyrate diminished rhombicosidodecahedron")
      expectApplyTo("gyrate bidiminished rhombicosidodecahedron")

      // false cases
      expectApplyTo("tridiminished rhombicosidodecahedron", false)
      expectApplyTo("parabidiminished rhombicosidodecahedron", false)
    })

    it("works on elementary solids", () => {
      expectApplyTo("augmented sphenocorona")
    })
  })
})
