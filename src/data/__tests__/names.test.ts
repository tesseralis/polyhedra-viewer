import { allSolidNames } from "data"
import { alternateNames } from "../names"

describe("polyhedra names", () => {
  describe("alternate names", () => {
    it("does not coincide with any canonical names", () => {
      for (const altNames of Object.values(alternateNames)) {
        for (const altName of altNames) {
          expect(allSolidNames).not.toContain(altName)
        }
      }
    })
  })
})
