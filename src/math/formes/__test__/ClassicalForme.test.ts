import ClassicalForme from "../ClassicalForme"
import { getSpecs2 } from "data/specs/getSpecs"

describe("ClassicalForme", () => {
  describe("facet faces", () => {
    it("works correctly for snub tetratetrahedron", () => {
      const forme = ClassicalForme.fromSpecs(
        getSpecs2("snub tetratetrahedron") as any,
      )
      const faceFaces = forme.facetFaces("face")
      const vertexFaces = forme.facetFaces("vertex")
      for (const vertexFace of vertexFaces) {
        if (faceFaces.some((face) => vertexFace.inSet(face.adjacentFaces()))) {
          fail(`Vertex face #${vertexFace.index} is adjacent to a face-face`)
        }
      }
    })
  })
})
