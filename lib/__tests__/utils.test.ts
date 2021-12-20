import { cartesian } from "../utils"

describe("cartesian", () => {
  it("calculates the cartesian product of records of arrays", () => {
    const object = {
      a: [1, 2],
      b: ["a", "b"],
    }
    const result = [...cartesian(object)]
    expect(result).toEqual([
      { a: 1, b: "a" },
      { a: 1, b: "b" },
      { a: 2, b: "a" },
      { a: 2, b: "b" },
    ])
  })
})
