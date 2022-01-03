import { PolyhedronForme } from "./BaseForme"
import ClassicalForme from "./ClassicalForme"
import CapstoneForme from "./CapstoneForme"
import CompositeForme from "./CompositeForme"
import ElementaryForme from "./ElementaryForme"

import { PolyhedronSpecs, getSpecs } from "specs"
import { getGeometry } from "math/operations/operationUtils"
import { Polyhedron } from "math/polyhedra"

// TODO figure out how to return the right forme without the `any` cast
// TODO figure out the most optimal place to normalize solids
export default function createForme<S extends PolyhedronSpecs>(
  specs: S,
  geom: Polyhedron,
): PolyhedronForme<S> {
  if (specs.isClassical()) return ClassicalForme.create(specs, geom) as any
  if (specs.isCapstone()) return CapstoneForme.create(specs, geom) as any
  if (specs.isComposite()) return CompositeForme.create(specs, geom) as any
  if (specs.isElementary()) return ElementaryForme.create(specs, geom) as any
  throw new Error(`Invalid specs`)
}

export function fromSpecs<S extends PolyhedronSpecs>(
  specs: S,
): PolyhedronForme<S> {
  // TODO it's kind of unwieldy to re-orient the polyhedron like this
  const forme = createForme(specs, getGeometry(specs))
  // return forme
  // FIXME we should orient the polyhedron before returning, but this breaks the tests
  return createForme(specs, forme.orient())
}

export function fromName(name: string) {
  return fromSpecs(getSpecs(name))
}
