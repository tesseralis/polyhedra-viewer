import PolyhedronForme from "./PolyhedronForme"
import ClassicalForme from "./ClassicalForme"
import PrismaticForme from "./PrismaticForme"
import CapstoneForme from "./CapstoneForme"
import CompositeForme from "./CompositeForme"

import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { Polyhedron } from "math/polyhedra"
import { getGeometry } from "math/operations/operationUtils"

export default function createForme<Specs extends PolyhedronSpecs>(
  specs: Specs,
  geom: Polyhedron,
): PolyhedronForme<any> {
  if (specs.isClassical()) return ClassicalForme.create(specs, geom)
  if (specs.isPrismatic()) return PrismaticForme.create(specs, geom)
  if (specs.isCapstone()) return CapstoneForme.create(specs, geom)
  if (specs.isComposite()) return CompositeForme.create(specs, geom)
  // TODO ElementaryForme and others
  return new PolyhedronForme(specs, geom)
}

export function createFormeFromSpecs<Specs extends PolyhedronSpecs>(
  specs: Specs,
): PolyhedronForme<Specs> {
  return createForme(specs, getGeometry(specs))
}
