import { gyrate } from "../gyrate"
import { makeApplyTo } from "../../operationTestUtils"

const expectApplyTo = makeApplyTo(gyrate)

describe("gyrate", () => {
  describe("canApplyTo", () => {
    it("works on capstones", () => {
      // only birotundate, bicupolae, and cupolarotundae work
      expectApplyTo("square orthobicupola")
      expectApplyTo("elongated triangular gyrobicupola")
      expectApplyTo("pentagonal orthobicupola")
      expectApplyTo("gyroelongated pentagonal cupolarotunda")

      expectApplyTo("square cupola", false)
      expectApplyTo("elongated pentagonal cupola", false)
      expectApplyTo("triangular bipyramid", false)
    })

    it("works on rhombicosidodecahedra", () => {
      // FIXME
      // expectApplyTo("rhombicosidodecahedron")
      expectApplyTo("trigyrate rhombicosidodecahedron")
      expectApplyTo("metabidiminished rhombicosidodecahedron")
      expectApplyTo("paragyrate diminished rhombicosidodecahedron")
      // false cases
      expectApplyTo("parabidiminished rhombicosidodecahedron", false)
      expectApplyTo("tridiminished rhombicosidodecahedron", false)
    })
  })
})
