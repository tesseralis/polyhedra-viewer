import { Twist } from "types"
import Capstone from "data/specs/Capstone"
import Prismatic from "data/specs/Prismatic"
import Operation from "./Operation"
import {
  elongate as _elongate,
  gyroelongPyramid,
  gyroelongCupola,
  gyroelongBipyramid,
  gyroelongBicupola,
  turnPrismatic,
  turnPyramid,
  turnCupola,
  turnBipyramid,
  turnBicupola,
} from "../operations-new/elongate"
import { toOpArgs, multiDualOpArgs } from "./adapters"

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

export const shorten = new Operation<Options, Capstone>("shorten", {
  ...toOpArgs("right", [
    _elongate,
    gyroelongPyramid,
    gyroelongCupola,
    gyroelongBipyramid,
    gyroelongBicupola,
  ]),
})

export const turn = new Operation<Options, Prismatic | Capstone>(
  "turn",
  multiDualOpArgs([
    turnPrismatic as any,
    turnPyramid,
    turnCupola,
    turnBipyramid,
    turnBicupola,
  ]),
)
