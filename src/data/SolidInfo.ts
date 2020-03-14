import { getType, getAlternateNames, toConwayNotation } from "./names"
import { getSymmetry, getSymmetryName, getOrder } from "./symmetry"
import { platonic, prisms, capstones } from "./tables/solidTables"

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

  isRegular() {
    return platonic.contains(this.name, { operation: "regular" })
  }

  /**
   * A polyhedron is quasiregular if it has exactly two types of regular faces,
   * which alternate around each vertex.
   */
  isQuasiRegular() {
    return platonic.contains(this.name, { operation: "rectified" })
  }

  isUniform() {
    return platonic.contains(this.name) || prisms.contains(this.name)
  }

  isChiral() {
    return (
      platonic.contains(
        this.name,
        ({ n, operation }) => operation === "snub" && n !== 3,
      ) ||
      capstones.contains(
        this.name,
        ({ elongation, count, base }) =>
          elongation === "antiprism" && count === 2 && base !== "pyramid",
      )
    )
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
