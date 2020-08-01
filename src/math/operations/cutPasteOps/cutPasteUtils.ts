import { pickBy } from "lodash-es"
import { Face, Cap } from "math/polyhedra"
import Capstone, { CapType, Gyration, gyrations } from "data/specs/Capstone"
import Composite, { Align } from "data/specs/Composite"
import CompositeForme from "math/formes/CompositeForme"
import Elementary from "data/specs/Elementary"
import { OpArgs } from "../Operation"
import PolyhedronForme from "math/formes/PolyhedronForme"
import CapstoneForme from "math/formes/CapstoneForme"
import { GraphGenerator, OpInput, toDirected } from "../operationPairs"
import removeCap from "./removeCap"
import addCap, { CrossAxis } from "./addCap"

function canAugment(forme: PolyhedronForme, face: Face) {
  if (forme instanceof CapstoneForme) {
    return forme.baseFaces().some((base) => base.equals(face))
  } else if (forme instanceof CompositeForme) {
    return forme.canAugment(face)
  } else {
    // Elementary solid
    return face.numSides === 4
  }
}

function hasRotunda(info: CutPasteSpecs) {
  if (info.isCapstone()) {
    return info.isMono() && info.isSecondary() && info.isPentagonal()
  }
  return false
}

function getUsingOpts(info: CutPasteSpecs): CapType[] | null {
  if (hasRotunda(info)) {
    return ["cupola", "rotunda"]
  }
  return null
}

function hasGyrateOpts(info: CutPasteSpecs) {
  if (info.isCapstone()) {
    if (!info.isMono()) return false
    // Gyroelongated capstones are always gyro
    if (info.isGyroelongated()) return false
    // Cupolae and rotundae (that are not the gyrobifastigium) always have gyrate opts
    if (!info.isDigonal() && info.isSecondary()) return true
    return false
  }
  if (info.isComposite()) {
    return info.isGyrateSolid()
  }
  return false
}

export type CutPasteSpecs = Capstone | Composite | Elementary

export interface CapOptions {
  cap: Cap
}

interface DimGraphOpts {
  using?: CapType
  align?: Align
  gyrate?: Gyration
}

interface AugGraphOpts extends DimGraphOpts {
  faceType?: number
}

interface AugOptions {
  face: Face
  gyrate?: Gyration
  using?: CapType
}

type AugDimGraphGenerator<S> = GraphGenerator<S, AugGraphOpts, DimGraphOpts>

interface CutPastePairInput<F extends PolyhedronForme> {
  /** The bidirectional graph representing solids that can be augmented or diminished. */
  graph(): AugDimGraphGenerator<F["specs"]>
  /** How to transform the arguments to graph options for diminish */
  toDimGraphOpts?(forme: F, options: CapOptions): DimGraphOpts
  /** How to transform the arguments to graph options for augment */
  toAugGraphOpts?(forme: F, options: AugOptions): AugGraphOpts
  /** Get the axis of the polyhedron base when augmenting */
  baseAxis?(forme: F, options: AugOptions): CrossAxis | undefined
}

interface CutPastePair<F extends PolyhedronForme> {
  augment: OpInput<AugOptions, F, AugGraphOpts>
  diminish: OpInput<CapOptions, F, DimGraphOpts>
}

function defaultGraphOpts() {
  return {}
}

/**
 * Create a pair of augment/diminish operations.
 */
export function makeCutPastePair<F extends PolyhedronForme>(
  input: CutPastePairInput<F>,
): CutPastePair<F> {
  return {
    augment: {
      graph: toDirected("left", input.graph),
      toGraphOpts: input.toAugGraphOpts ?? defaultGraphOpts,
      apply(forme, options) {
        const { using, face } = options
        const baseAxis = input.baseAxis?.(forme, options)
        return addCap(forme.geom, face, baseAxis, using)
      },
    },
    diminish: {
      graph: toDirected("right", input.graph),
      toGraphOpts: input.toDimGraphOpts ?? defaultGraphOpts,
      apply: ({ geom }, { cap }) => removeCap(geom, cap),
    },
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
type AugOptionArgs = Partial<
  OpArgs<AugOptions, PolyhedronForme<CutPasteSpecs>, AugGraphOpts>
>

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

// TODO putting this here is a little awkward
export const augOptionArgs: AugOptionArgs = {
  hasOptions() {
    return true
  },

  hitOption: "face",
  getHitOption(forme, hitPnt, options) {
    if (!options) return {}
    const face = forme.geom.hitFace(hitPnt)
    return canAugment(forme, face) ? { face } : {}
  },

  faceSelectionStates(forme, { face }) {
    return forme.geom.faces.map((f) => {
      if (face && f.equals(face)) return "selected"
      if (canAugment(forme, f)) return "selectable"
      return undefined
    })
  },

  allOptions(forme) {
    const { specs, geom } = forme
    return {
      gyrate: hasGyrateOpts(specs) ? gyrations : [undefined],
      using: getUsingOpts(specs) ?? [undefined],
      face: geom.faces.filter((face) => canAugment(forme, face)),
    }
  },

  defaultOptions(info) {
    const usingOpts = getUsingOpts(info) ?? []
    return pickBy({
      gyrate: hasGyrateOpts(info) && "gyro",
      using: usingOpts.length > 1 && usingOpts[0],
    })
  },
}
