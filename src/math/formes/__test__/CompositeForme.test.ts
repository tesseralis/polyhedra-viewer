import CompositeForme from "../CompositeForme"
import { Face } from "math/polyhedra"

describe("CompositeForme", () => {
  describe("canAugment", () => {
    it("returns true for all faces of tetrahedron", () => {
      const forme = CompositeForme.fromName("tetrahedron")
      const faces = forme.geom.faces
      function canAugment(face: Face) {
        return forme.canAugment(face)
      }
      expect(faces).toSatisfyAll(canAugment)
    })
  })
})
