import { Twist } from "types"
import Capstone from "data/specs/Capstone"
import Operation from "../Operation"
import {
  elongate as _elongate,
  gyroelongPyramid,
  gyroelongCupola,
  gyroelongBipyramid,
  gyroelongBicupola,
} from "../../operations-new/elongate"
import { toOpArgs } from "../adapters"

export const elongate = new Operation<{}, Capstone>(
  "elongate",
  toOpArgs("left", [_elongate]),
)

interface Options {
  twist?: Twist
}
export const gyroelongate = new Operation<Options, Capstone>(
  "gyroelongate",
  toOpArgs("left", [
    gyroelongPyramid,
    gyroelongCupola,
    gyroelongBipyramid,
    gyroelongBicupola,
  ]),
)
