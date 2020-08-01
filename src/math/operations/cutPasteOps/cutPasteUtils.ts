import { Cap } from "math/polyhedra"
import Capstone, { CapType, Gyration, gyrations } from "data/specs/Capstone"
import Composite, { Align } from "data/specs/Composite"
import Elementary from "data/specs/Elementary"
import { OpArgs } from "../Operation"
import PolyhedronForme from "math/formes/PolyhedronForme"
import CapstoneForme from "math/formes/CapstoneForme"
import { GraphGenerator } from "../operationPairs"

export type CutPasteSpecs = Capstone | Composite | Elementary

export interface CapOptions {
  cap: Cap
}

export interface DimGraphOpts {
  using?: CapType
  align?: Align
  gyrate?: Gyration
}

export interface AugGraphOpts extends DimGraphOpts {
  faceType?: number
}

type AugDimGraphGenerator<S> = GraphGenerator<S, AugGraphOpts, DimGraphOpts>

export function* augDimCapstoneGraph(): AugDimGraphGenerator<Capstone> {
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

export function* augDimAugmentedSolidGraph(): AugDimGraphGenerator<Composite> {
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

export function* augDimDiminishedSolidGraph(): AugDimGraphGenerator<Composite> {
  for (const solid of Composite.query.where(
    (s) => s.isDiminishedSolid() && s.isDiminished() && !s.isAugmented(),
  )) {
    const options = solid.isTri() ? [3, 5] : [5]
    for (const faceType of options) {
      yield {
        left: solid,
        right: solid.augmentDiminished(faceType === 5),
        options: {
          left: { faceType },
          right: { align: solid.data.align },
        },
      }
    }
  }
}

export function* augDimGyrateSolidGraph(): AugDimGraphGenerator<Composite> {
  for (const solid of Composite.query.where(
    (s) => s.isGyrateSolid() && s.isDiminished(),
  )) {
    for (const gyrate of gyrations) {
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

export function* augDimElementaryGraph(): AugDimGraphGenerator<Elementary> {
  yield {
    left: Elementary.query.withName("sphenocorona"),
    right: Elementary.query.withName("augmented sphenocorona"),
  }
}

function getCaps(forme: PolyhedronForme) {
  if (forme instanceof CapstoneForme) {
    return forme.baseCaps()
  } else {
    // FIXME this doesn't return the right thing for composite
    return forme.geom.caps()
  }
}

type CapOptionArgs = Partial<OpArgs<CapOptions, PolyhedronForme, DimGraphOpts>>

export const capOptionArgs: CapOptionArgs = {
  hasOptions() {
    return true
  },

  allOptions(forme) {
    return {
      cap: getCaps(forme),
    }
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
