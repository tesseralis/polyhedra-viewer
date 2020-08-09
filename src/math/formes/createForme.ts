import PolyhedronForme from "./PolyhedronForme"
import ClassicalForme from "./ClassicalForme"
import CapstoneForme from "./CapstoneForme"
import CompositeForme from "./CompositeForme"
import ElementaryForme from "./ElementaryForme"

import { PolyhedronSpecs } from "specs"
import { Polyhedron } from "math/polyhedra"

export default function createForme<Specs extends PolyhedronSpecs>(
  specs: Specs,
  geom: Polyhedron,
): PolyhedronForme {
  if (specs.isClassical()) return ClassicalForme.create(specs, geom)
  if (specs.isCapstone()) return CapstoneForme.create(specs, geom)
  if (specs.isComposite()) return CompositeForme.create(specs, geom)
  if (specs.isElementary()) return ElementaryForme.create(specs, geom)
  throw new Error(`Invalid specs: ${specs.name()}`)
}
