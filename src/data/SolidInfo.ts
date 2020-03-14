import { getType, getAlternateNames, toConwayNotation } from "./names"
import { getSymmetry, getSymmetryName, getOrder } from "./symmetry"

/**
 * Class containing miscellaneous information about a CRF polyhedron
 * that can be gleaned outside of its geometry.
 */
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

  /**
   * A polyhedron is quasiregular if it has exactly two types of regular faces,
   * which alternate around each vertex.
   */
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

  /**
   * Returns `true` if the polyhedron can tile space.
   */
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
