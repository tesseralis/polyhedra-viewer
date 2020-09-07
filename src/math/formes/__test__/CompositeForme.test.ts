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

  describe("caps", () => {
    describe("rhombitetratetrahedron", () => {
      it("only counts four caps for unmodified", () => {
        const forme = CompositeForme.fromName("rhombitetratetrahedron")
        expect(forme.caps()).toHaveLength(4)
      })

      it("only counts one cap for gyrate", () => {
        const forme = CompositeForme.fromName("gyrate rhombitetratetrahedron")
        expect(forme.caps()).toHaveLength(1)
      })

      it("counts no caps for diminished", () => {
        const forme = CompositeForme.fromName(
          "diminished rhombitetratetrahedron",
        )
        expect(forme.caps()).toHaveLength(0)
      })
    })

    describe("rhombicuboctahedron", () => {
      it("only counts two opposite caps for bigyrate", () => {
        const forme = CompositeForme.fromName("bigyrate rhombicuboctahedron")
        const caps = forme.caps()
        expect(caps).toHaveLength(2)
        const [c1, c2] = caps
        expect(c1.isInverse(c2)).toBeTrue()
      })
    })
  })

  describe("gyrateCaps", () => {
    it("returns 1 for gyrate tetratetrahedron", () => {
      const forme = CompositeForme.fromName("gyrate rhombitetratetrahedron")
      expect(forme.gyrateCaps()).toHaveLength(1)
    })

    it("returns one for gyrate rhombicuboctahedron", () => {
      const forme = CompositeForme.fromName("gyrate rhombicuboctahedron")
      expect(forme.gyrateCaps()).toHaveLength(1)
    })

    it("returns one for gyrate diminished rhombicuboctahedron", () => {
      const forme = CompositeForme.fromName(
        "gyrate diminished rhombicuboctahedron",
      )
      expect(forme.gyrateCaps()).toHaveLength(1)
    })

    it("returns two for bigyrate rhombicuboctahedron", () => {
      const forme = CompositeForme.fromName("bigyrate rhombicuboctahedron")
      expect(forme.gyrateCaps()).toHaveLength(2)
    })
  })
})
