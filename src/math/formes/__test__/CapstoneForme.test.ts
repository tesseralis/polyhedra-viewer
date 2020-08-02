import { Edge } from "math/polyhedra"
import { isInverse } from "math/geom"
import CapstoneForme from "../CapstoneForme"
import { getSpecs2 } from "data/specs/getSpecs"

describe("CapstoneForme", () => {
  describe("bases()", () => {
    it("returns two opposite edges for digonal antiprism", () => {
      const forme = CapstoneForme.fromSpecs(
        getSpecs2("digonal antiprism") as any,
      )
      const bases = forme.bases()
      expect(bases).toSatisfyAll((base) => base instanceof Edge)
      expect(isInverse(bases[0].normal(), bases[1].normal()))
    })
  })
})
