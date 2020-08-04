import { useCallback } from "react"
import { isEmpty, isEqual } from "lodash-es"
import { Vector3 } from "three"

import { Cap } from "math/polyhedra"
import {
  PolyhedronCtx,
  OperationCtx,
  TransitionCtx,
  useApplyOperation,
} from "../../context"

export default function useHitOptions() {
  const polyhedron = PolyhedronCtx.useState()
  const { isTransitioning } = TransitionCtx.useState()
  const { operation, options = {} } = OperationCtx.useState()
  const { setOption } = OperationCtx.useActions()
  const applyOperation = useApplyOperation()
  const { hitOption = "" } = operation ?? {}

  const setHitOption = (hitPnt: Vector3) => {
    if (!operation || isTransitioning) return
    const newHitOptions = operation.getHitOption(polyhedron, hitPnt, options)
    if (isEmpty(newHitOptions)) {
      return setOption(hitOption, undefined)
    }
    const newValue = newHitOptions[hitOption]
    if (!isEqual(options[hitOption], newValue)) {
      setOption(hitOption, newValue)
    }
  }

  const unsetHitOption = () => {
    if (!operation) return
    setOption(hitOption, undefined)
  }
  const applyWithHitOption = useCallback(
    (hitPnt: Vector3) => {
      if (!operation || isTransitioning) return
      const newHitOptions = operation.getHitOption(polyhedron, hitPnt, options)
      const newValue = newHitOptions[hitOption]
      // only apply operation if we have a hit
      if (options && newValue) {
        applyOperation(
          operation,
          { ...options, [hitOption]: newValue },
          (result) => {
            // If we're still on a cap, select it
            if (hitOption === "cap" && options[hitOption]) {
              setOption("cap", Cap.find(result, options[hitOption].topPoint))
            }
          },
        )
      }
    },
    [
      operation,
      applyOperation,
      hitOption,
      isTransitioning,
      options,
      polyhedron,
      setOption,
    ],
  )
  return { setHitOption, unsetHitOption, applyWithHitOption }
}
