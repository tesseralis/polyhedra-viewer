import { Cap } from "math/polyhedra"
import Capstone from "data/specs/Capstone"
import Composite from "data/specs/Composite"
import Elementary from "data/specs/Elementary"
import { OpArgs } from "../Operation"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import PolyhedronForme from "math/formes/PolyhedronForme"
import CapstoneForme from "math/formes/CapstoneForme"

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

function getCaps(forme: PolyhedronForme<any>) {
  if (forme instanceof CapstoneForme) {
    return forme.baseCaps()
  } else {
    return forme.geom.caps()
  }
}

type CapOptionArgs<Specs extends PolyhedronSpecs> = Partial<
  OpArgs<CapOptions, Specs, PolyhedronForme<Specs>>
>

export const capOptionArgs: CapOptionArgs<PolyhedronSpecs> = {
  hasOptions() {
    return true
  },

  *allOptionCombos(forme) {
    for (const cap of getCaps(forme)) yield { cap }
  },

  hitOption: "cap",
  getHitOption({ geom }, hitPnt) {
    // FIXME only allow the right caps
    const cap = Cap.find(geom, hitPnt)
    return cap ? { cap } : {}
  },

  faceSelectionStates(forme, { cap }) {
    const allCapFaces = getCaps(forme).flatMap((cap) => cap.faces())
    return forme.geom.faces.map((face) => {
      if (cap instanceof Cap && face.inSet(cap.faces())) return "selected"
      if (face.inSet(allCapFaces)) return "selectable"
      return undefined
    })
  },
}
