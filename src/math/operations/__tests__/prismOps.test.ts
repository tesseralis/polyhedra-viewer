import { elongate, gyroelongate, shorten, turn } from "../prismOps"
import { makeApplyTo, makeHasOptions } from "../operationTestUtils"

describe("elongate", () => {
  describe("canApplyTo", () => {
    const expectApplyTo = makeApplyTo(elongate)

    it("works on capstones", () => {
      // only works on shortened capstones
      expectApplyTo("triangular pyramid")
      expectApplyTo("square cupola")
      expectApplyTo("pentagonal rotunda")
      expectApplyTo("pentagonal bipyramid")
      expectApplyTo("triangular orthobicupola")
      expectApplyTo("pentagonal orthocupolarotunda")

      expectApplyTo("elongated triangular pyramid", false)
      expectApplyTo("gyroelongated pentagonal bicupola", false)

      // doesn't work on fastigium
      // expectApplyTo("triangular prism", false)
      expectApplyTo("digonal gyrobicupola", false)
    })
  })
})

describe("gyroelongate", () => {
  describe("canApplyTo", () => {
    const expectApplyTo = makeApplyTo(gyroelongate)

    it("works on capstones", () => {
      expectApplyTo("square cupola")
      expectApplyTo("pentagonal rotunda")
      expectApplyTo("pentagonal bipyramid")
      expectApplyTo("triangular orthobicupola")
      expectApplyTo("pentagonal orthocupolarotunda")

      expectApplyTo("elongated triangular pyramid", false)
      expectApplyTo("gyroelongated pentagonal bicupola", false)

      // doesn't work on fastigium
      // expectApplyTo("triangular prism", false)
      expectApplyTo("digonal gyrobicupola", false)

      // doesn't work on triangular pyramids
      expectApplyTo("triangular pyramid", false)
      expectApplyTo("triangular bipyramid", false)
    })
  })

  describe("hasOptions", () => {
    const expectHasOptions = makeHasOptions(gyroelongate)

    describe("works on capstones", () => {
      // only works on bicupolae/birotundae
      expectHasOptions("square orthobicupola")
      expectHasOptions("pentagonal gyrobirotunda")
      expectHasOptions("pentagonal orthocupolarotunda")

      // false cases
      expectHasOptions("pentagonal bipyramid", false)
      expectHasOptions("pentagonal cupola", false)
    })
  })
})

describe("shorten", () => {
  const expectApplyTo = makeApplyTo(shorten)
  const expectHasOptions = makeHasOptions(shorten)

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
  const expectApplyTo = makeApplyTo(turn)
  const expectHasOptions = makeHasOptions(turn)

  describe("canApplyTo", () => {
    it("works on prismatics", () => {
      expectApplyTo("square prism")
      expectApplyTo("triangular antiprism")
      expectApplyTo("pentagonal prism")
      expectApplyTo("octagonal antiprism")

      expectApplyTo("digonal antiprism", false)
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
