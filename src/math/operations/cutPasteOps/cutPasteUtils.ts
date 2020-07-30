import { getSingle } from "utils"
import { Cap, Polyhedron } from "math/polyhedra"
import { isInverse } from "math/geom"
import Capstone from "data/specs/Capstone"
import Composite from "data/specs/Composite"
import Elementary from "data/specs/Elementary"
import { OpArgs } from "../Operation"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import PolyhedronForme from "math/formes/PolyhedronForme"

export type CutPasteSpecs = Capstone | Composite | Elementary

type Count = Composite["data"]["augmented"]

export function inc(count: Count): Count {
  if (count === 3) throw new Error(`Count ${count} is too high to increment`)
  return (count + 1) as any
}

export function dec(count: Count): Count {
  if (count === 0) throw new Error(`Count ${count} is too low to decrement`)
  return (count - 1) as any
}

export function getCupolaGyrate(cap: Cap) {
  const isOrtho = cap.boundary().edges.every((edge) => {
    const [n1, n2] = edge.adjacentFaces().map((f) => f.numSides)
    return (n1 === 4) === (n2 === 4)
  })
  return isOrtho ? "ortho" : "gyro"
}

export function getCapAlignment(polyhedron: Polyhedron, cap: Cap) {
  const isRhombicosidodecahedron = cap.type === "cupola"
  const orthoCaps = isRhombicosidodecahedron
    ? Cap.getAll(polyhedron).filter((cap) => getCupolaGyrate(cap) === "ortho")
    : []

  const otherNormal =
    orthoCaps.length > 0
      ? getSingle(orthoCaps).boundary().normal()
      : polyhedron.largestFace().normal()

  return isInverse(cap.normal(), otherNormal) ? "para" : "meta"
}

export interface CapOptions {
  cap: Cap
}

export type CutPasteOpArgs<
  Opts,
  Specs extends PolyhedronSpecs,
  Forme extends PolyhedronForme<Specs>
> = Pick<OpArgs<Opts, Specs, Forme>, "apply" | "canApplyTo" | "getResult">

export function combineOps<
  Opts,
  Specs extends PolyhedronSpecs,
  Forme extends PolyhedronForme<Specs>
>(
  ops: CutPasteOpArgs<Opts, Specs, Forme>[],
): CutPasteOpArgs<Opts, Specs, Forme> {
  function canApplyTo(specs: Specs) {
    return ops.some((op) => op.canApplyTo(specs))
  }
  function getOp(specs: Specs) {
    const entry = ops.find((op) => op.canApplyTo(specs))
    if (!entry) {
      throw new Error(`Could not apply any operations to ${specs.name}`)
    }
    return entry
  }

  // TODO deduplicate this with the other combineOps
  return {
    canApplyTo,
    apply(forme, options) {
      return getOp(forme.specs).apply(forme, options)
    },
    getResult(forme, options) {
      return getOp(forme.specs).getResult(forme, options)
    },
  }
}

type CapOptionArgs<Specs extends PolyhedronSpecs> = Partial<
  OpArgs<CapOptions, Specs, PolyhedronForme<Specs>>
>

export const capOptionArgs: CapOptionArgs<PolyhedronSpecs> = {
  hasOptions() {
    return true
  },

  *allOptionCombos({ geom }) {
    // FIXME this should be restricted (e.g. for diminished icosahedron)
    for (const cap of Cap.getAll(geom)) yield { cap }
  },

  hitOption: "cap",
  getHitOption({ geom }, hitPnt) {
    const cap = Cap.find(geom, hitPnt)
    return cap ? { cap } : {}
  },

  faceSelectionStates({ geom }, { cap }) {
    const allCapFaces = Cap.getAll(geom).flatMap((cap) => cap.faces())
    return geom.faces.map((face) => {
      if (cap instanceof Cap && face.inSet(cap.faces())) return "selected"
      if (face.inSet(allCapFaces)) return "selectable"
      return undefined
    })
  },
}
