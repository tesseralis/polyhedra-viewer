import { find } from "utils"
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

  describe("getFacet", () => {
    describe("rhombitetratetrahedra", () => {
      it("works for gyrate", () => {
        const forme = CompositeForme.fromName("gyrate rhombitetratetrahedron")
        const facets = forme.geom.faces.map((face) => forme.getFacet(face))

        // make sure there are an equal number of face and facet vertices
        expect(facets.filter((f) => f === "face")).toHaveLength(4)
        expect(facets.filter((f) => f === "vertex")).toHaveLength(4)

        // Make sure there are 3-1 ratios on the gyrated cap and the source face
        // make sure the face facet is the center of the gyrate cap
        const gyrateFaceFacet = find(
          forme.geom.faces,
          (face) => forme.isGyrateFace(face) && forme.isFacetFace(face, "face"),
        )
        const gyrateAdjFaces = gyrateFaceFacet.vertexAdjacentFaces()
        expect(
          gyrateAdjFaces.filter((face) => forme.isFacetFace(face, "vertex")),
        ).toHaveLength(3)

        // make sure the vertex facet is an inner face in the source
        const sourceVertexFacet = find(
          forme.geom.faces,
          (face) =>
            !forme.isGyrateFace(face) && forme.isFacetFace(face, "vertex"),
        )
        const sourceAdjFaces = sourceVertexFacet.vertexAdjacentFaces()
        expect(
          sourceAdjFaces.filter((face) => forme.isFacetFace(face, "face")),
        ).toHaveLength(3)
      })

      it("works for diminished", () => {
        const forme = CompositeForme.fromName(
          "diminished rhombitetratetrahedron",
        )
        const facets = forme.geom.faces.map((face) => forme.getFacet(face))

        // check there are three face facets, one vertex facet
        expect(facets.filter((f) => f === "face")).toHaveLength(3)
        expect(facets.filter((f) => f === "vertex")).toHaveLength(1)

        // make sure the vertex facet is surrounded by the others
        const vertexFacet = find(forme.geom.faces, (face) =>
          forme.isFacetFace(face, "vertex"),
        )
        const adjFaces = vertexFacet.vertexAdjacentFaces()
        expect(
          adjFaces.filter((face) => forme.isFacetFace(face, "face")),
        ).toHaveLength(3)
      })
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
