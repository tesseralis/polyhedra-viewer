import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Operation } from "math/operations"
import { Polyhedron } from "math/polyhedra"
import { escape } from "utils"
import PolyhedronCtx from "./PolyhedronCtx"
import OperationCtx from "./OperationCtx"
import TransitionCtx from "./TransitionCtx"

type ResultCallback = (polyhedron: Polyhedron) => void

// TODO figure out stricter typing here
type Options = any
export default function useApplyOperation() {
  const navigate = useNavigate()
  const { setOperation, unsetOperation } = OperationCtx.useActions()
  const polyhedron = PolyhedronCtx.useState()
  const transition = TransitionCtx.useTransition()

  const applyOperation = useCallback(
    (
      operation: Operation<Options>,
      options: Options = {},
      callback?: ResultCallback,
    ) => {
      if (!operation) throw new Error("no operation defined")

      const { result, animationData } = operation.apply(polyhedron, options)
      // If the current operation has options and the result has options,
      // keep the options set
      if (
        operation.hasOptions(polyhedron) &&
        operation.canApplyTo(result) &&
        operation.hasOptions(result)
      ) {
        setOperation(operation, result)
      } else {
        unsetOperation()
      }

      transition(result, animationData)
      navigate(`/${escape(result.name)}/operations`)
      if (typeof callback === "function") {
        callback(result)
      }
    },
    [polyhedron, navigate, transition, setOperation, unsetOperation],
  )

  return applyOperation
}
