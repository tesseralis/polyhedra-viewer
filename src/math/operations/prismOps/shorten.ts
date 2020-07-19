import Capstone from "data/specs/Capstone"
import { Twist } from "types"
import {
  elongate as _elongate,
  gyroelongPyramid,
  gyroelongCupola,
  gyroelongBipyramid,
  gyroelongBicupola,
} from "../../operations-new/elongate"
import { toOpArgs } from "../adapters"

import Operation from "../Operation"

interface Options {
  twist?: Twist
}
export const shorten = new Operation<Options, Capstone>("shorten", {
  ...toOpArgs("right", [
    _elongate,
    gyroelongPyramid,
    gyroelongCupola,
    gyroelongBipyramid,
    gyroelongBicupola,
  ]),
})
