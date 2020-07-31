import { Cap } from "math/polyhedra"
import Capstone from "data/specs/Capstone"
import Composite from "data/specs/Composite"
import Elementary from "data/specs/Elementary"
import { OpArgs } from "../Operation"
import PolyhedronForme from "math/formes/PolyhedronForme"
import CapstoneForme from "math/formes/CapstoneForme"
import { GraphGenerator } from "../operationPairs"
import { find } from "utils"

export type CutPasteSpecs = Capstone | Composite | Elementary

export interface CapOptions {
  cap: Cap
}

export type CutPasteOpArgs<Opts, Forme extends PolyhedronForme> = Pick<
  OpArgs<Opts, Forme>,
  "graph" | "apply" | "toGraphOpts"
>

export function* augDimCapstoneGraph(): GraphGenerator<Capstone, any, any> {
  for (const cap of Capstone.query.where(
    (s) => !s.isPrismatic() && (s.isBi() || !s.isShortened()),
  )) {
    for (const capType of cap.capTypes()) {
      yield {
        left: cap.remove(capType),
        right: cap,
        options: {
          left: { gyrate: cap.data.gyrate, using: capType },
          right: { using: capType },
        },
      }
    }
  }
}

export function* augDimAugmentedSolidGraph(): GraphGenerator<
  Composite,
  any,
  any
> {
  for (const solid of Composite.query.where(
    (s) => s.isAugmentedSolid() && s.isAugmented(),
  )) {
    yield {
      left: solid.diminish(),
      right: solid,
      options: {
        left: { align: solid.data.align },
        right: {},
      },
    }
  }
}

export function* augDimDiminishedSolidGraph(): GraphGenerator<
  Composite,
  any,
  any
> {
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

export function* augDimGyrateSolidGraph(): GraphGenerator<Composite, any, any> {
  for (const solid of Composite.query.where(
    (s) => s.isGyrateSolid() && s.isDiminished(),
  )) {
    for (const gyrate of ["ortho", "gyro"] as const) {
      yield {
        left: solid,
        right: solid.augmentGyrate(gyrate),
        options: {
          left: { gyrate },
          right: { gyrate, align: solid.data.align },
        },
      }
    }
  }
}

export function* augDimElementaryGraph(): GraphGenerator<Elementary, any, any> {
  yield {
    left: Elementary.query.withName("sphenocorona"),
    right: Elementary.query.withName("augmented sphenocorona"),
  }
}

export function* gyrateCapstoneGraph(): GraphGenerator<Capstone, any, any> {
  for (const cap of Capstone.query.where(
    (s) => s.isBi() && s.isSecondary() && !s.isGyro() && !s.isDigonal(),
  )) {
    yield { left: cap, right: cap.gyrate() }
  }
}

export function* gyrateCompositeGraph(): GraphGenerator<Composite, any, any> {
  for (const solid of Composite.query.where(
    (s) => s.isGyrateSolid() && s.isGyrate(),
  )) {
    yield {
      left: solid.ungyrate(),
      right: solid,
      options: {
        left: { direction: "forward", align: solid.data.align },
        right: { direction: "back" },
      },
    }
  }
}

export function combineOps<Opts, Forme extends PolyhedronForme>(
  ops: CutPasteOpArgs<Opts, Forme>[],
): CutPasteOpArgs<Opts, Forme> {
  function getOp(solid: Forme["specs"]) {
    return find(ops, (op) =>
      [...op.graph()].some((entry) => entry.start.equals(solid)),
    )
  }

  // TODO deduplicate this with the other combineOps
  return {
    graph: function* () {
      for (const op of ops) {
        yield* op.graph()
      }
    },
    apply(forme, options) {
      return getOp(forme.specs).apply(forme, options)
    },
    toGraphOpts(solid, ops) {
      return getOp(solid.specs).toGraphOpts(solid, ops)
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
