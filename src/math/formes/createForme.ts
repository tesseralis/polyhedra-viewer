import { PolyhedronForme } from "./BaseForme"
import ClassicalForme from "./ClassicalForme"
import CapstoneForme from "./CapstoneForme"
import CompositeForme from "./CompositeForme"
import ElementaryForme from "./ElementaryForme"

import { PolyhedronSpecs } from "specs"
import { Polyhedron } from "math/polyhedra"

// TODO figure out how to return the right forme without the `any` cast
export default function createForme<S extends PolyhedronSpecs>(
  specs: S,
  geom: Polyhedron,
): PolyhedronForme<S> {
  if (specs.isClassical()) return ClassicalForme.create(specs, geom) as any
  if (specs.isCapstone()) return CapstoneForme.create(specs, geom) as any
  if (specs.isComposite()) return CompositeForme.create(specs, geom) as any
  if (specs.isElementary()) return ElementaryForme.create(specs, geom) as any
  throw new Error(`Invalid specs: ${specs.name()}`)
}
