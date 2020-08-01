import { augment } from "../augment"
import { makeApplyTo } from "../../operationTestUtils"

const expectApplyTo = makeApplyTo(augment)

// TODO test other methods:
// * defaultOptions
// * allOptions
// * hasOptions always returns true
describe("augment", () => {
  describe("canApplyTo", () => {
    it("works on prisms and antiprisms", () => {
      expectApplyTo("square prism")
      expectApplyTo("pentagonal prism")
      expectApplyTo("octagonal antiprism")
    })

    it("works on capstones", () => {
      expectApplyTo("elongated triangular cupola")
      expectApplyTo("square pyramid")
      expectApplyTo("gyroelongated pentagonal rotunda")

      // does not work on bi capstones
      expectApplyTo("pentagonal orthobicupola", false)
      expectApplyTo("gyroelongated square bipyramid", false)

      // does not work on gyroelongated triangular
      expectApplyTo("octahedron", false)
    })

    it("works on augmented composites", () => {
      // FIXME these fail because they pick up the wrong specs
      // expectApplyTo("dodecahedron")
      expectApplyTo("augmented truncated cube")
      expectApplyTo("metabiaugmented hexagonal prism")

      // false if maxed out
      expectApplyTo("augmented truncated tetrahedron", false)
      expectApplyTo("biaugmented pentagonal prism", false)
      expectApplyTo("triaugmented dodecahedron", false)

      // false if parabiaugmented
      expectApplyTo("parabiaugmented dodecahedron", false)
    })

    it("works on diminished icosahedra", () => {
      expectApplyTo("metabidiminished icosahedron")
      expectApplyTo("tridiminished icosahedron")
      // fully maxed out
      // expectApplyTo("icosahedron", false)
      expectApplyTo("augmented tridiminished icosahedron", false)
    })

    it("works on rhombicosidodecahedra", () => {
      // expectApplyTo("rhombicosidodecahedron", false)
      expectApplyTo("diminished rhombicosidodecahedron")
      expectApplyTo("tridiminished rhombicosidodecahedron")
      expectApplyTo("metagyrate diminished rhombicosidodecahedron")

      // false if only gyrated
      expectApplyTo("gyrate rhombicosidodecahedron", false)
      expectApplyTo("metabigyrate rhombicosidodecahedron", false)
      expectApplyTo("trigyrate rhombicosidodecahedron", false)
    })

    it("works on elementary solids", () => {
      expectApplyTo("sphenocorona")
    })
  })
})
