import {
  platonic,
  capstones,
  rhombicosidodecahedra,
} from "../categories/solidGroups"

describe("solidGroups", () => {
  describe("platonic and archimedean solids", () => {
    it("has 18 items", () => {
      expect(platonic.getAll()).toHaveLength(18)
    })

    it("contains the proper entries for the tetrahedron row", () => {
      expect(platonic.getAll({ n: 3 })).toEqual(
        expect.arrayContaining(["octahedron", "cuboctahedron", "icosahedron"]),
      )
    })
  })

  describe("capstones", () => {
    it("does not have entries for gyroelongated triangular pyramids", () => {
      expect(
        capstones.getAll({ n: 3, base: "pyramid", elongation: "antiprism" }),
      ).toHaveLength(0)
    })
    it("only has two entries for gyrobifastigium", () => {
      expect(capstones.getAll({ n: 2 })).toEqual([
        "triangular prism",
        "gyrobifastigium",
      ])
    })
    it("does not have single-count entries for copula-rotunda", () => {
      expect(
        capstones.getAll({ base: "cupola-rotunda", count: 1 }),
      ).toHaveLength(0)
    })
  })

  describe("rhombicosidodecahedra", () => {
    it("has 13 members", () => {
      expect(rhombicosidodecahedra.getAll()).toHaveLength(13)
    })
  })
})
