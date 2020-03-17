import getSymmetry from "./getSymmetry"

describe("symmetry", () => {
  describe("getSymmetryName", () => {
    function expectSymmetryName(solid: string, expected: string) {
      expect(getSymmetry(solid).name()).toEqual(expected)
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
        expectSymmetryName(
          "pentagonal orthocupolarotunda",
          "pentagonal pyramidal",
        )
        expectSymmetryName(
          "gyroelongated pentagonal cupolarotunda",
          "pentagonal",
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

  describe("getSymmetrySymbol", () => {
    function expectSymbol(solid: string, expected: string) {
      expect(getSymmetry(solid).symbolStr()).toEqual(expected)
    }

    it("works on most polyhedra", () => {
      expectSymbol("cube", "O_h")
      expectSymbol("rhombicosidodecahedron", "I_h")
      expectSymbol("pentagonal prism", "D_5h")
      expectSymbol("hexagonal antiprism", "D_6d")
      expectSymbol("gyroelongated pentagonal cupolarotunda", "C_5")
    })

    it("assigns the correct symbol to tetrahedron", () => {
      expectSymbol("tetrahedron", "T_d")
    })

    it("assigns a special symbol to bilateral symmetry", () => {
      expectSymbol("augmented sphenocorona", "C_s")
    })
  })

  describe("getOrder", () => {
    function expectOrder(solid: string, expected: number) {
      expect(getSymmetry(solid).order()).toEqual(expected)
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
