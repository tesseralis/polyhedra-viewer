import {
  truncate,
  sharpen,
  pare,
  alternate,
  unalternate,
  pinch,
  rectify,
  unrectify,
  semisnub,
  unsnub,
} from "./truncateOps"
import { dual, expand, snub, contract, twist } from "./resizeOps"
import { elongate, gyroelongate, shorten, turn } from "./prismOps"
import { augment, diminish, gyrate } from "./cutPasteOps"
import { double, halve } from "./doubleHalveOps"
import { increment, decrement } from "./incDecOps"

export type { default as Operation, AnimationData } from "./Operation"

export const operations = {
  dual,
  truncate,
  sharpen,
  pare,
  alternate,
  unalternate,
  pinch,
  rectify,
  unrectify,
  semisnub,
  unsnub,
  expand,
  snub,
  contract,
  twist,
  elongate,
  gyroelongate,
  shorten,
  turn,
  double,
  halve,
  increment,
  decrement,
  augment,
  diminish,
  gyrate,
}

export type OpName = keyof typeof operations
