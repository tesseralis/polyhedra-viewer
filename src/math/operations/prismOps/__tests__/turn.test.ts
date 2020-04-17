import { turn } from "../turn"
import { Polyhedron } from "math/polyhedra"

function expectApplyTo(name: string, value: boolean = true) {
  expect(turn.canApplyTo(Polyhedron.get(name))).toEqual(value)
}

function expectHasOptions(name: string, value: boolean = true) {
  expect(turn.hasOptions(Polyhedron.get(name))).toEqual(value)
}

describe("turn", () => {
  describe("apply", () => {
    it("applies twist left and right correctly", () => {
      const polyhedron = Polyhedron.get("gyroelongated pentagonal bicupola")
      expect(turn.apply(polyhedron, { twist: "right" }).result.name).toEqual(
        "elongated pentagonal gyrobicupola",
      )
      expect(turn.apply(polyhedron, { twist: "left" }).result.name).toEqual(
        "elongated pentagonal orthobicupola",
      )
    })
  })

  describe("canApplyTo", () => {
    it("works on prismatics", () => {
      expectApplyTo("cube")
      expectApplyTo("octahedron")
      expectApplyTo("pentagonal prism")
      expectApplyTo("octagonal antiprism")

      // false on digonal antiprism
      expectApplyTo("tetrahedron", false)
    })

    it("works on nonshortened capstones", () => {
      expectApplyTo("gyroelongated pentagonal pyramid")
      expectApplyTo("elongated square bipyramid")
      expectApplyTo("elongated square cupola")

      // false cases
      expectApplyTo("square pyramid", false)
      expectApplyTo("pentagonal orthocupolarotunda", false)

      // false on elongated triangular pyramid
      expectApplyTo("elongated triangular pyramid", false)
      expectApplyTo("elongated triangular bipyramid", false)
    })
  })

  describe("hasOptions", () => {
    it("is true only on bicupolae", () => {
      expectHasOptions("elongated square gyrobicupola")
      expectHasOptions("gyroelongated triangular bicupola")
      expectHasOptions("elongated pentagonal gyrobirotunda")
      expectHasOptions("gyroelongated pentagonal cupolarotunda")

      expectHasOptions("pentagonal antiprism", false)
      expectHasOptions("elongated square bipyramid", false)
      expectHasOptions("gyroelongated square cupola", false)
    })
  })
})
