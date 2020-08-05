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

    it("returns true for side faces of triangular pyramid", () => {
      const forme = CompositeForme.fromName("triangular prism")
      const faces = forme.geom.facesWithNumSides(4)
      function canAugment(face: Face) {
        return forme.canAugment(face)
      }
      expect(faces).toSatisfyAll(canAugment)
    })

    it("return true for square faces of augmented triangular pyramid", () => {
      const forme = CompositeForme.fromName("augmented triangular prism")
      const faces = forme.geom.facesWithNumSides(4)
      function canAugment(face: Face) {
        return forme.canAugment(face)
      }
      expect(faces).toSatisfyAll(canAugment)
    })
  })
})
