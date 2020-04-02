import { truncate, rectify, sharpen } from "./truncateOps"
import { dual, expand, snub, contract, twist } from "./resizeOps"
import { elongate, gyroelongate, shorten, turn } from "./prismOps"
import { augment, diminish, gyrate } from "./cutPasteOps"

import PolyhedronSpecs from "data/specs/PolyhedronSpecs"

import {
  Operation as _Operation,
  OperationResult as _OperationResult,
  AnimationData as _AnimationData,
} from "./makeOperation"

export type Operation<Opts> = _Operation<Opts, PolyhedronSpecs>
export type OperationResult = _OperationResult
export type AnimationData = _AnimationData

export const operations = {
  dual,
  truncate,
  rectify,
  sharpen,
  expand,
  snub,
  contract,
  twist,
  elongate,
  gyroelongate,
  shorten,
  turn,
  augment,
  diminish,
  gyrate,
}

export type OpName = keyof typeof operations
