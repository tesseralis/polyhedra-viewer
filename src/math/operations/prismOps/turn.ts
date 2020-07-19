import { Twist } from "types"
import Prismatic from "data/specs/Prismatic"
import Capstone from "data/specs/Capstone"
import Operation from "../Operation"
import {
  turnPrismatic,
  turnPyramid,
  turnCupola,
  turnBipyramid,
  turnBicupola,
} from "../../operations-new/elongate"
import { multiDualOpArgs } from "../adapters"

interface Options {
  twist?: Twist
}
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
