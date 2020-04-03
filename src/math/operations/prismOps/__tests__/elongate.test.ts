import { elongate, gyroelongate } from "../elongate"
import { Polyhedron } from "math/polyhedra"

describe("elongate", () => {
  describe("canApplyTo", () => {
    function expectApplyTo(name: string, value: boolean = true) {
      expect(elongate.canApplyTo(Polyhedron.get(name))).toEqual(value)
    }

    it("works on capstones", () => {
      // only works on shortened capstones
      expectApplyTo("tetrahedron")
      expectApplyTo("square cupola")
      expectApplyTo("pentagonal rotunda")
      expectApplyTo("pentagonal bipyramid")
      expectApplyTo("triangular orthobicupola")
      expectApplyTo("pentagonal orthocupolarotunda")

      expectApplyTo("elongated triangular pyramid", false)
      expectApplyTo("gyroelongated pentagonal bicupola", false)

      // doesn't work on fastigium
      expectApplyTo("triangular prism", false)
      expectApplyTo("gyrobifastigium", false)
    })
  })
})

describe("gyroelongate", () => {
  describe("canApplyTo", () => {
    function expectApplyTo(name: string, value: boolean = true) {
      expect(gyroelongate.canApplyTo(Polyhedron.get(name))).toEqual(value)
    }

    it("works on capstones", () => {
      expectApplyTo("square cupola")
      expectApplyTo("pentagonal rotunda")
      expectApplyTo("pentagonal bipyramid")
      expectApplyTo("triangular orthobicupola")
      expectApplyTo("pentagonal orthocupolarotunda")

      expectApplyTo("elongated triangular pyramid", false)
      expectApplyTo("gyroelongated pentagonal bicupola", false)

      // doesn't work on fastigium
      expectApplyTo("triangular prism", false)
      expectApplyTo("gyrobifastigium", false)

      // doesn't work on tetrahedra
      expectApplyTo("tetrahedron", false)
      expectApplyTo("triangular bipyramid", false)
    })
  })

  describe("hasOptions", () => {
    function expectHasOptions(name: string, value: boolean = true) {
      expect(gyroelongate.hasOptions(Polyhedron.get(name))).toEqual(value)
    }

    describe("works on capstones", () => {
      // only works on bicupolae/birotundae
      expectHasOptions("square orthobicupola")
      expectHasOptions("icosidodecahedron")
      expectHasOptions("pentagonal orthocupolarotunda")

      // false cases
      expectHasOptions("pentagonal bipyramid", false)
      expectHasOptions("pentagonal cupola", false)
    })
  })
})
