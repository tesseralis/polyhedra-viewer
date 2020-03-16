import { allSolidNames } from "data"
import { choose } from "utils"

// TODO move this to the /components directory
export const escapeName = (name: string) => name.replace(/ /g, "-")
export const unescapeName = (name: string) => name.replace(/-/g, " ")
export function randomSolidName(): string {
  return choose(allSolidNames)
}
