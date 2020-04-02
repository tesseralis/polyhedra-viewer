import { shorten } from "../shorten"
import { Polyhedron } from "math/polyhedra"

function expectApplyTo(name: string, value: boolean = true) {
  expect(shorten.canApplyTo(Polyhedron.get(name))).toEqual(value)
}

function expectHasOptions(name: string, value: boolean = true) {
  expect(shorten.hasOptions(Polyhedron.get(name))).toEqual(value)
}

describe("shorten", () => {
  describe("canApplyTo", () => {
    it("works on nonshortened capstones", () => {
      // elongated and gyroelongated capstones
      expectApplyTo("elongated square pyramid")
      expectApplyTo("elongated triangular cupola")
      expectApplyTo("gyroelongated pentagonal cupolarotunda")

      // invalid on prisms and shortened capstones
      expectApplyTo("decagonal prism", false)
      expectApplyTo("square antiprism", false)

      expectApplyTo("pentagonal cupola", false)
      expectApplyTo("pentagonal bipyramid", false)
    })
  })

  describe("hasOptions", () => {
    it("true only if gyroelongated bicupola", () => {
      // true only if gyroelongated bicupola
      expectHasOptions("gyroelongated square bicupola")
      expectHasOptions("gyroelongated pentagonal cupolarotunda")

      // false for everything else
      expectHasOptions("gyroelongated square cupola", false)
      expectHasOptions("gyroelongated square bipyramid", false)
      expectHasOptions("elongated square gyrobicupola", false)
    })
  })
})
