import { OperationCtx } from "components/ViewerPage/context"
import TwistOptions from "./TwistOptions"
import AugmentOptions from "./AugmentOptions"

function hasTwist(opName: string) {
  return ["snub", "twist", "gyroelongate", "shorten", "turn"].includes(opName)
}

export default function Options() {
  const { operation } = OperationCtx.useState()
  if (!operation) return null
  if (operation.name === "augment") return <AugmentOptions />
  if (hasTwist(operation.name)) return <TwistOptions />
  return null
}
