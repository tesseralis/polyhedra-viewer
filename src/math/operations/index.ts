import {
  truncate,
  cotruncate,
  sharpen,
  // cosharpen,
  rectify,
  // unrectify,
} from "./truncateOps"
import { dual, expand, snub, contract, twist } from "./resizeOps"
import { elongate, gyroelongate, shorten, turn } from "./prismOps"
import { augment, diminish, gyrate } from "./cutPasteOps"

export type { default as Operation, AnimationData } from "./Operation"

export const operations = {
  dual,
  truncate,
  cotruncate,
  sharpen,
  // cosharpen,
  rectify,
  // unrectify,
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
