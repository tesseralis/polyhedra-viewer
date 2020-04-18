import { interpolate } from "d3-interpolate"

import { Callback, TransitionOptions } from "../transition"

export default <T extends object>(
  { startValue, endValue, onFinish }: TransitionOptions<T>,
  onUpdate: Callback<T>,
) => {
  console.log("calling mock transition")
  const interp = interpolate(startValue, endValue)
  onUpdate(interp(0))
  onUpdate(interp(0.5))
  onUpdate(interp(1))
  onFinish()
}
