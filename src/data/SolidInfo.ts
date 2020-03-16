import { toConwayNotation } from "./names"
import { getAlternateNames } from "./alternates"
import { getSymmetry, getSymmetryName, getOrder } from "./symmetry"
import { classicals, prisms, capstones, rhombicosidodecahedra } from "./tables"

/**
 * Class containing miscellaneous information about a CRF polyhedron
 * that can be gleaned outside of its geometry.
 */
export default class SolidInfo {
  name: string

  constructor(name: string) {
    this.name = name
  }

  alternateNames = () => getAlternateNames(this.name)

  symbol = () => toConwayNotation(this.name)

  symmetry = () => getSymmetry(this.name)

  symmetryName = () => getSymmetryName(this.symmetry())

  order = () => getOrder(this.name)

  inClassicalTable(filter?: Parameters<typeof classicals.contains>[1]) {
    return classicals.contains(this.name, filter)
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

  type() {
    if (this.inClassicalTable({ operation: "regular" })) {
      return "Platonic solid"
    }
    if (this.inClassicalTable()) {
      return "Archimedean solid"
    }
    if (this.inPrismTable({ type: "prism" })) {
      return "Prism"
    }
    if (this.inPrismTable({ type: "antiprism" })) {
      return "Antiprism"
    }
    return "Johnson solid"
  }

  isRegular() {
    return this.inClassicalTable({ operation: "regular" })
  }

  /**
   * A polyhedron is quasiregular if it has exactly two types of regular faces,
   * which alternate around each vertex.
   */
  isQuasiRegular() {
    return this.inClassicalTable({ operation: "rectified" })
  }

  isUniform() {
    return this.inClassicalTable() || this.inPrismTable()
  }

  isChiral() {
    return (
      this.inClassicalTable(
        ({ family, operation }) => operation === "snub" && family !== 3,
      ) ||
      this.inCapstoneTable(
        ({ elongation, count, type }) =>
          elongation === "antiprism" && count === 2 && type !== "pyramid",
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
