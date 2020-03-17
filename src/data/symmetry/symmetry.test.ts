import { Cyclic, Dihedral, Polyhedral } from "./Symmetry"

describe("Polyhedral Symmetry", () => {
  describe(".name()", () => {
    it("works on achiral polyhedra", () => {
      expect(Polyhedral.get("tetrahedral").name()).toEqual("full tetrahedral")
      expect(Polyhedral.get("octahedral").name()).toEqual("full octahedral")
      expect(Polyhedral.get("icosahedral").name()).toEqual("full icosahedral")
    })

    it("works on chiral polyhedra", () => {
      expect(Polyhedral.get("tetrahedral", true).name()).toEqual(
        "chiral tetrahedral",
      )
      expect(Polyhedral.get("octahedral", true).name()).toEqual(
        "chiral octahedral",
      )
      expect(Polyhedral.get("icosahedral", true).name()).toEqual(
        "chiral icosahedral",
      )
    })
  })

  describe(".symbol()", () => {
    it("uses a special symbol for full tetrahedral", () => {
      expect(Polyhedral.get("tetrahedral").symbolStr()).toEqual("T_d")
    })

    it("works on all other polyhedra", () => {
      expect(Polyhedral.get("octahedral").symbolStr()).toEqual("O_h")
      expect(Polyhedral.get("icosahedral").symbolStr()).toEqual("I_h")
      expect(Polyhedral.get("tetrahedral", true).symbolStr()).toEqual("T")
      expect(Polyhedral.get("octahedral", true).symbolStr()).toEqual("O")
      expect(Polyhedral.get("icosahedral", true).symbolStr()).toEqual("I")
    })
  })

  describe(".order()", () => {
    it("works on chiral polyhedra", () => {
      expect(Polyhedral.get("tetrahedral", true).order()).toEqual(12)
      expect(Polyhedral.get("octahedral", true).order()).toEqual(24)
      expect(Polyhedral.get("icosahedral", true).order()).toEqual(60)
    })
    it("works on achiral polyhedra", () => {
      expect(Polyhedral.get("tetrahedral").order()).toEqual(24)
      expect(Polyhedral.get("octahedral").order()).toEqual(48)
      expect(Polyhedral.get("icosahedral").order()).toEqual(120)
    })
  })
})

describe("Cyclic", () => {
  describe(".name()", () => {
    it("specially handles n=1", () => {
      expect(Cyclic.get(1).name()).toEqual("bilateral")
    })
    it("specially handles n=2", () => {
      expect(Cyclic.get(2).name()).toEqual("biradial")
    })
    it("handles chiral cases", () => {
      expect(Cyclic.get(5, true).name()).toEqual("pentagonal")
    })
    it("handles achiral cases", () => {
      expect(Cyclic.get(3).name()).toEqual("triangular pyramidal")
      expect(Cyclic.get(4).name()).toEqual("square pyramidal")
      expect(Cyclic.get(5).name()).toEqual("pentagonal pyramidal")
    })
  })

  describe(".symbol()", () => {
    it("handles in chiral cases", () => {
      expect(Cyclic.get(3, true).symbolStr()).toEqual("C_3")
      expect(Cyclic.get(5, true).symbolStr()).toEqual("C_5")
    })
    it("handles achiral cases", () => {
      expect(Cyclic.get(3).symbolStr()).toEqual("C_3v")
      expect(Cyclic.get(5).symbolStr()).toEqual("C_5v")
    })
  })

  describe(".order()", () => {
    it("correctly calculates chiral cases", () => {
      expect(Cyclic.get(3, true).order()).toEqual(3)
      expect(Cyclic.get(5, true).order()).toEqual(5)
    })
    it("correctly calculates achiral cases", () => {
      expect(Cyclic.get(3).order()).toEqual(6)
      expect(Cyclic.get(5).order()).toEqual(10)
    })
  })

  describe(".bilateral", () => {
    it("returns C_1v", () => {
      expect(Cyclic.bilateral.symbolStr()).toEqual("C_1v")
    })
  })

  describe(".biradial", () => {
    it("returns C_2v", () => {
      expect(Cyclic.biradial.symbolStr()).toEqual("C_2v")
    })
  })
})

describe("DihedralSymmetry", () => {
  describe(".name()", () => {
    it("handles chiral cases", () => {
      expect(Dihedral.get(4).name()).toEqual("square dihedral")
      expect(Dihedral.get(5).name()).toEqual("pentagonal dihedral")
    })
    it("handles prismatic cases", () => {
      expect(Dihedral.get(2, "prism").name()).toEqual("digonal prismatic")
      expect(Dihedral.get(5, "prism").name()).toEqual("pentagonal prismatic")
      expect(Dihedral.get(6, "prism").name()).toEqual("hexagonal prismatic")
    })
    it("handles antiprismatic cases", () => {
      expect(Dihedral.get(4, "antiprism").name()).toEqual(
        "square antiprismatic",
      )
    })
  })

  describe(".symbol()", () => {
    it("handles chiral cases", () => {
      expect(Dihedral.get(5).symbolStr()).toEqual("D_5")
    })
    it("handles prismatic cases", () => {
      expect(Dihedral.get(4, "prism").symbolStr()).toEqual("D_4h")
    })
    it("handles antiprismatic cases", () => {
      expect(Dihedral.get(4, "antiprism").symbolStr()).toEqual("D_4d")
    })
  })

  describe(".order()", () => {
    it("correctly calculates chiral cases", () => {
      expect(Dihedral.get(5).order()).toEqual(10)
    })
    it("correctly calculates achiral cases", () => {
      expect(Dihedral.get(4, "prism").order()).toEqual(16)
      expect(Dihedral.get(4, "antiprism").order()).toEqual(16)
    })
  })
})
