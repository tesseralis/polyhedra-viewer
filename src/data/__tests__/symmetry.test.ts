import * as sym from "../symmetry"

describe("symmetry", () => {
  describe("getSymmetryName", () => {
    function expectSymmetryName(solid: string, expected: string) {
      expect(sym.getSymmetryName(sym.getSymmetry(solid))).toEqual(expected)
    }
    it("works on platonic and archimedean solids", () => {
      expectSymmetryName("snub cube", "chiral octahedral")
      expectSymmetryName("cube", "full octahedral")
    })

    it("works on prisms and antiprisms", () => {
      expectSymmetryName("hexagonal prism", "hexagonal prismatic")
      expectSymmetryName("octagonal antiprism", "octagonal antiprismatic")
    })

    describe("johnson solids", () => {
      it("works on capstones", () => {
        expectSymmetryName("pentagonal pyramid", "pentagonal pyramidal")
        expectSymmetryName(
          "elongated triangular bipyramid",
          "triangular prismatic",
        )
        expectSymmetryName(
          "gyroelongated square bipyramid",
          "square antiprismatic",
        )
        expectSymmetryName("gyrobifastigium", "digonal antiprismatic")
        // TODO can test all cupolarotundae
        expectSymmetryName(
          "pentagonal orthocupolarotunda",
          "pentagonal pyramidal",
        )
      })

      it("works on augmented prisms", () => {
        expectSymmetryName("augmented triangular prism", "biradial")
        expectSymmetryName("biaugmented pentagonal prism", "biradial")
        expectSymmetryName(
          "parabiaugmented hexagonal prism",
          "digonal prismatic",
        )
        expectSymmetryName(
          "triaugmented hexagonal prism",
          "triangular prismatic",
        )
      })

      it("works on augmented Platonic and Archimedean solids", () => {
        expectSymmetryName("triaugmented dodecahedron", "triangular pyramidal")
        expectSymmetryName(
          "augmented truncated tetrahedron",
          "triangular pyramidal",
        )
        expectSymmetryName("biaugmented truncated cube", "square prismatic")
      })

      it("works on rhombicosidodecahedra", () => {
        expectSymmetryName(
          "paragyrate diminished rhombicosidodecahedron",
          "pentagonal pyramidal",
        )
      })

      it("works on elementary solids", () => {
        expectSymmetryName("augmented sphenocorona", "bilateral")
        expectSymmetryName("sphenocorona", "biradial")
      })
    })
  })

  describe("getOrder", () => {
    function expectOrder(solid: string, expected: number) {
      expect(sym.getOrder(solid)).toEqual(expected)
    }

    it("works on platonic and archimedean solids", () => {
      expectOrder("tetrahedron", 24)
      expectOrder("snub cube", 24)
      expectOrder("rhombicosidodecahedron", 120)
    })

    it("works on prisms and antiprisms", () => {
      expectOrder("hexagonal prism", 24)
      expectOrder("octagonal antiprism", 32)
    })

    it("works on johnson solids", () => {
      expectOrder("augmented sphenocorona", 2)
      expectOrder("sphenocorona", 4)
      expectOrder("square pyramid", 8)
      expectOrder("triaugmented dodecahedron", 6)
    })
  })
})
