import PolyhedronForme from "./PolyhedronForme"
import ClassicalForme from "./ClassicalForme"
import CapstoneForme from "./CapstoneForme"
import CompositeForme from "./CompositeForme"

import { PolyhedronSpecs } from "specs"
import { Polyhedron } from "math/polyhedra"

export default function createForme<Specs extends PolyhedronSpecs>(
  specs: Specs,
  geom: Polyhedron,
): PolyhedronForme {
  if (specs.isClassical()) return ClassicalForme.create(specs, geom)
  if (specs.isCapstone()) return CapstoneForme.create(specs, geom)
  if (specs.isComposite()) return CompositeForme.create(specs, geom)
  // TODO ElementaryForme and others
  return new PolyhedronForme(specs, geom)
}
