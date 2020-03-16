import { classics, capstones, rhombicosidodecahedra } from ".."

describe("solidTables", () => {
  describe("Platonic and Archimedean solids", () => {
    it("has 18 items", () => {
      expect(classics.get()).toHaveLength(18)
    })

    it("contains the proper entries for the tetrahedron row", () => {
      expect(classics.get({ family: 3 })).toEqual(
        expect.arrayContaining(["octahedron", "cuboctahedron", "icosahedron"]),
      )
    })
  })

  describe("capstones", () => {
    it("does not have entries for gyroelongated triangular pyramids", () => {
      expect(
        capstones.get({ n: 3, base: "pyramid", elongation: "antiprism" }),
      ).toHaveLength(0)
    })

    it("only has two entries for gyrobifastigium", () => {
      expect(capstones.get({ n: 2 })).toEqual([
        "triangular prism",
        "gyrobifastigium",
      ])
    })

    it("does not have single-count entries for copula-rotunda", () => {
      expect(capstones.get({ base: "cupolarotunda", count: 1 })).toHaveLength(0)
    })
  })

  describe("rhombicosidodecahedra", () => {
    it("contains the normal rhombicosidodecahedron", () => {
      expect(
        rhombicosidodecahedra.contains("rhombicosidodecahedron"),
      ).toBeTruthy()
    })

    it("has 13 members", () => {
      expect(rhombicosidodecahedra.get()).toHaveLength(13)
    })
  })
})
