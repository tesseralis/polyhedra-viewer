import { allSolidNames } from "data"
import { alternateNamesMapping } from "../alternates"

describe("alternate names", () => {
  it("does not coincide with any canonical names", () => {
    for (const altNames of Object.values(alternateNamesMapping)) {
      for (const altName of altNames) {
        expect(allSolidNames).not.toContain(altName)
      }
    }
  })
})
