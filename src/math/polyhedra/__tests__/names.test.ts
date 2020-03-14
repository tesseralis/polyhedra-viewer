import { allSolidNames } from "data"
import * as names from "../../../data/names"

describe("polyhedra names", () => {
  describe("alternate names", () => {
    it("does not coincide with any canonical names", () => {
      Object.values(names.alternateNames).forEach(altNames => {
        altNames.forEach(altName => {
          expect(allSolidNames).not.toContain(altName)
        })
      })
    })
  })
})
