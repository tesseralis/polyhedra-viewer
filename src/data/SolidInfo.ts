import { getType, getAlternateNames, toConwayNotation } from "./names"
import { getSymmetry, getSymmetryName, getOrder } from "./symmetry"

export default class SolidInfo {
  name: string
  constructor(name: string) {
    this.name = name
  }

  type = () => getType(this.name)

  alternateNames = () => getAlternateNames(this.name)

  symbol = () => toConwayNotation(this.name)

  symmetry = () => getSymmetry(this.name)

  symmetryName = () => getSymmetryName(this.symmetry())

  order = () => getOrder(this.name)

  isUniform() {
    return [
      "Platonic solid",
      "Archimedean solid",
      "Prism",
      "Antiprism",
    ].includes(this.type())
  }

  isQuasiRegular() {
    return ["octahedron", "cuboctahedron", "icosidodecahedron"].includes(
      this.name,
    )
  }

  isRegular() {
    return this.type() === "Platonic solid"
  }

  isChiral() {
    return [
      "snub cube",
      "snub dodecahedron",
      "gyroelongated triangular bicupola",
      "gyroelongated square bicupola",
      "gyroelongated pentagonal bicupola",
      "gyroelongated pentagonal cupolarotunda",
      "gyroelongated pentagonal birotunda",
    ].includes(this.name)
  }

  isHoneycomb() {
    return [
      "cube",
      "truncated octahedron",
      "triangular prism",
      "hexagonal prism",
      "gyrobifastigium",
    ].includes(this.name)
  }
}
