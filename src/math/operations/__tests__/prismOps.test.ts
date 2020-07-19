import { elongate, gyroelongate, shorten, turn } from "../prismOps"
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

describe("shorten", () => {
  function expectApplyTo(name: string, value: boolean = true) {
    expect(shorten.canApplyTo(Polyhedron.get(name))).toEqual(value)
  }

  function expectHasOptions(name: string, value: boolean = true) {
    expect(shorten.hasOptions(Polyhedron.get(name))).toEqual(value)
  }

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

describe("turn", () => {
  function expectApplyTo(name: string, value: boolean = true) {
    expect(turn.canApplyTo(Polyhedron.get(name))).toEqual(value)
  }

  function expectHasOptions(name: string, value: boolean = true) {
    expect(turn.hasOptions(Polyhedron.get(name))).toEqual(value)
  }

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
