import { getType, getAlternateNames, toConwayNotation } from "./names"
import { getSymmetry, getSymmetryName, getOrder } from "./symmetry"
import { classics, prisms, capstones, rhombicosidodecahedra } from "./tables"

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

  inClassicTable(filter?: Parameters<typeof classics.contains>[1]) {
    return classics.contains(this.name, filter)
  }

  inPrismTable(filter?: Parameters<typeof prisms.contains>[1]) {
    return prisms.contains(this.name, filter)
  }

  inCapstoneTable(filter?: Parameters<typeof capstones.contains>[1]) {
    return capstones.contains(this.name, filter)
  }

  inRhombicosidodecahedronTable(
    filter?: Parameters<typeof rhombicosidodecahedra.contains>[1],
  ) {
    return rhombicosidodecahedra.contains(this.name, filter)
  }

  isRegular() {
    return this.inClassicTable({ operation: "regular" })
  }

  /**
   * A polyhedron is quasiregular if it has exactly two types of regular faces,
   * which alternate around each vertex.
   */
  isQuasiRegular() {
    return this.inClassicTable({ operation: "rectified" })
  }

  isUniform() {
    return this.inClassicTable() || this.inPrismTable()
  }

  isChiral() {
    return (
      this.inClassicTable(
        ({ n, operation }) => operation === "snub" && n !== 3,
      ) ||
      this.inCapstoneTable(
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
