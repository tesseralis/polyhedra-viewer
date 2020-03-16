import { classicals, capstones, rhombicosidodecahedra } from ".."

describe("solidTables", () => {
  describe("Platonic and Archimedean solids", () => {
    it("has 18 items", () => {
      expect(classicals.getNames()).toHaveLength(18)
    })

    it("contains the proper entries for the tetrahedron row", () => {
      expect(classicals.getNames({ family: 3 })).toEqual(
        expect.arrayContaining(["octahedron", "cuboctahedron", "icosahedron"]),
      )
    })
  })

  describe("capstones", () => {
    it("does not have entries for gyroelongated triangular pyramids", () => {
      expect(
        capstones.getNames({
          base: 3,
          type: "pyramid",
          elongation: "antiprism",
        }),
      ).toHaveLength(0)
    })

    it("only has two entries for gyrobifastigium", () => {
      expect(capstones.getNames({ base: 2 })).toEqual([
        "triangular prism",
        "gyrobifastigium",
      ])
    })

    it("does not have single-count entries for copula-rotunda", () => {
      expect(
        capstones.getNames({ type: "cupolarotunda", count: 1 }),
      ).toHaveLength(0)
    })
  })

  describe("rhombicosidodecahedra", () => {
    it("contains the normal rhombicosidodecahedron", () => {
      expect(
        rhombicosidodecahedra.contains("rhombicosidodecahedron"),
      ).toBeTruthy()
    })

    it("has 13 members", () => {
      expect(rhombicosidodecahedra.getNames()).toHaveLength(13)
    })
  })
})
