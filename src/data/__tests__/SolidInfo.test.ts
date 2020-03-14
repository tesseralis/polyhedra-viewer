import SolidInfo from "../SolidInfo"

describe("SolidInfo", () => {
  describe("isQuasiRegular", () => {
    it("works on all the quasiregular solids", () => {
      for (const name of ["octahedron", "cuboctahedron", "icosidodecahedron"]) {
        expect(new SolidInfo(name).isQuasiRegular()).toBeTruthy()
      }
    })
  })

  describe("isChiral", () => {
    it("includes all chiral solids", () => {
      const chiral = [
        "snub cube",
        "snub dodecahedron",
        "gyroelongated triangular bicupola",
        "gyroelongated square bicupola",
        "gyroelongated pentagonal bicupola",
        "gyroelongated pentagonal cupolarotunda",
        "gyroelongated pentagonal birotunda",
      ]
      for (const name of chiral) {
        expect(new SolidInfo(name).isChiral()).toBeTruthy()
      }
    })
    it("does not include the icosahedron", () => {
      expect(new SolidInfo("icosahedron").isChiral()).toBeFalsy()
    })
  })
})
