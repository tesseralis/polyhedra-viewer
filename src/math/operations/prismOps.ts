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
import { combineOps } from "./adapters"

export const elongate = new Operation("elongate", _elongate.left)

interface Options {
  twist?: Twist
}
export const gyroelongate = new Operation<Options, Capstone>(
  "gyroelongate",
  combineOps(
    [
      gyroelongPyramid,
      gyroelongCupola,
      gyroelongBipyramid,
      gyroelongBicupola,
    ].map((op) => op.left),
  ),
)

export const shorten = new Operation<Options, Capstone>(
  "shorten",
  combineOps(
    [
      _elongate,
      gyroelongPyramid,
      gyroelongCupola,
      gyroelongBipyramid,
      gyroelongBicupola,
    ].map((op) => op.right),
  ),
)

export const turn = new Operation<Options, Prismatic | Capstone>(
  "turn",
  combineOps(
    [
      turnPrismatic as any,
      turnPyramid,
      turnCupola,
      turnBipyramid,
      turnBicupola,
    ].flatMap((op) => [op.left, op.right]),
  ),
)
