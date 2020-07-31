import { Cap } from "math/polyhedra"
import Capstone from "data/specs/Capstone"
import Composite from "data/specs/Composite"
import Elementary from "data/specs/Elementary"
import { OpArgs } from "../Operation"
import PolyhedronForme from "math/formes/PolyhedronForme"
import CapstoneForme from "math/formes/CapstoneForme"
import { find } from "utils"

export type CutPasteSpecs = Capstone | Composite | Elementary

type Count = Composite["data"]["augmented"]

export function inc(count: Count): Count {
  if (count === 3) throw new Error(`Count ${count} is too high to increment`)
  return (count + 1) as Count
}

export function dec(count: Count): Count {
  if (count === 0) throw new Error(`Count ${count} is too low to decrement`)
  return (count - 1) as Count
}

export interface CapOptions {
  cap: Cap
}

export type CutPasteOpArgs<Opts, Forme extends PolyhedronForme> = Pick<
  OpArgs<Opts, Forme>,
  "apply" | "canApplyTo" | "getResult"
>

export function* augDimCapstoneGraph() {
  for (const cap of Capstone.query.where(
    (s) => !s.isPrismatic() && (s.isBi() || !s.isShortened()),
  )) {
    for (const capType of cap.capTypes()) {
      yield {
        left: cap.remove(capType),
        right: cap,
        options: {
          left: { gyrate: cap.data.gyrate, using: capType },
        },
      }
    }
  }
}

export function* augDimAugmentedSolidGraph() {
  for (const solid of Composite.query.where(
    (s) => s.isAugmentedSolid() && s.isAugmented(),
  )) {
    yield {
      left: solid.diminish(),
      right: solid,
      options: {
        left: { align: solid.data.align },
      },
    }
  }
}

export function* augDimDiminishedSolidGraph() {
  for (const solid of Composite.query.where(
    (s) => s.isDiminishedSolid() && s.isDiminished() && !s.isAugmented(),
  )) {
    const options = solid.isTri() ? [true, false] : [false]
    for (const option of options) {
      yield {
        left: solid,
        right: solid.augmentDiminished(option),
        options: {
          left: { triangular: option },
          right: { align: solid.data.align },
        },
      }
    }
  }
}

export function* augDimGyrateSolidGraph() {
  for (const solid of Composite.query.where(
    (s) => s.isGyrateSolid() && s.isDiminished(),
  )) {
    for (const gyrate of ["ortho", "gyro"] as const) {
      yield {
        left: solid,
        right: solid.augmentGyrate(gyrate),
        options: {
          left: { gyrate },
          right: { align: solid.data.align },
        },
      }
    }
  }
}

export function* augDimElementaryGraph() {
  yield {
    left: Elementary.query.withName("sphenocorona"),
    right: Elementary.query.withName("augmented sphenocorona"),
  }
}

export function* gyrateCapstoneGraph() {
  for (const cap of Capstone.query.where(
    (s) => s.isBi() && s.isSecondary() && !s.isGyro() && !s.isDigonal(),
  )) {
    yield { left: cap, right: cap.gyrate() }
  }
}

export function combineOps<Opts, Forme extends PolyhedronForme>(
  ops: CutPasteOpArgs<Opts, Forme>[],
): CutPasteOpArgs<Opts, Forme> {
  function canApplyTo(specs: Forme["specs"]) {
    return ops.some((op) => op.canApplyTo(specs))
  }
  function getOp(specs: Forme["specs"]) {
    return find(ops, (op) => op.canApplyTo(specs))
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

function getCaps(forme: PolyhedronForme) {
  if (forme instanceof CapstoneForme) {
    return forme.baseCaps()
  } else {
    return forme.geom.caps()
  }
}

type CapOptionArgs = Partial<OpArgs<CapOptions, PolyhedronForme>>

export const capOptionArgs: CapOptionArgs = {
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
