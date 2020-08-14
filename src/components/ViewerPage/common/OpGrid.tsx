import { uniq } from "lodash-es"

import React, { memo } from "react"

import { useStyle, scales } from "styles"
import { media, fonts } from "styles"
import { hover, scroll, square, flexColumn, flexRow } from "styles/common"
import { operations, OpName } from "math/operations"
import {
  useApplyOperation,
  OperationCtx,
  TransitionCtx,
  PolyhedronCtx,
} from "components/ViewerPage/context"
import OperationIcon from "./OperationIcon"

const opLayout: OpName[][] = [
  ["truncate", "rectify", "sharpen", "dual"],
  ["expand", "snub", "contract", "twist"],
  ["elongate", "gyroelongate", "shorten", "turn"],
  ["augment", "augment", "diminish", "gyrate"],
]

const shortcutKeys: Record<string, OpName> = {
  e: "expand",
  a: "rectify",
  s: "snub",
  t: "truncate",
}

const opList = uniq(opLayout.flat())

const Shortcuts = function () {
  const polyhedron = PolyhedronCtx.useState()
  const applyOperation = useApplyOperation()
  const { setOperation } = OperationCtx.useActions()

  const selectOperation = (name: OpName) => {
    const operation = operations[name]
    if (!operation.canApplyTo(polyhedron)) return

    if (operation.hasOptions(polyhedron)) {
      setOperation(operation, polyhedron)
    } else {
      applyOperation(operation)
    }
  }

  React.useEffect(() => {
    document.onkeydown = (e) => {
      if (shortcutKeys[e.key]) {
        selectOperation(shortcutKeys[e.key])
      }
      e.preventDefault()
    }
  })

  return null
}

interface Props {
  name: OpName
  disabled: boolean
}
const OpButton = memo(function ({ name, disabled }: Props) {
  const polyhedron = PolyhedronCtx.useState()
  const { operation: currentOp } = OperationCtx.useState()
  const { setOperation, unsetOperation } = OperationCtx.useActions()
  const applyOperation = useApplyOperation()
  const operation = operations[name]
  const isCurrent = !!currentOp && name === currentOp.name

  const css = useStyle(
    {
      ...flexColumn("center", "center"),
      ...hover,
      ...square("5rem"),
      border: isCurrent ? "2px DarkSlateGray solid" : "1px LightGray solid",
      fontFamily: fonts.verdana,
      fontSize: scales.font[7],
      color: "DimGray",
      backgroundColor: "white",

      ":disabled": { opacity: 0.3 },
      // add spacing since we're displayed in a row
      // TODO can we do this in the parent styling?
      [media.mobile]: {
        ":not(:last-child)": { marginRight: scales.spacing[2] },
      },
    },
    [isCurrent],
  )

  const selectOperation = () => {
    if (isCurrent) {
      return unsetOperation()
    }

    if (!operation.hasOptions(polyhedron)) {
      applyOperation(operation)
    } else {
      setOperation(operation, polyhedron)
    }
  }

  const createTitle = () => {
    if (!operation.canApplyTo(polyhedron) || disabled) return
    const key = Object.keys(shortcutKeys).find((k) => shortcutKeys[k] === name)

    if (key && shortcutKeys[key] === name) {
      return `${name} (${key})`
    }

    return name
  }
  return (
    <button
      {...css()}
      style={{ gridArea: name }}
      title={createTitle()}
      onClick={selectOperation}
      disabled={!operation.canApplyTo(polyhedron) || disabled}
    >
      <OperationIcon name={name} />
      {name}
    </button>
  )
})

const templateString = opLayout.map((line) => `"${line.join(" ")}"`).join("\n")

export default function OpGrid() {
  const { unsetOperation } = OperationCtx.useActions()
  const { isTransitioning } = TransitionCtx.useState()

  React.useEffect(() => {
    return () => {
      unsetOperation()
    }
  }, [unsetOperation])
  const css = useStyle({
    [media.notMobile]: {
      display: "grid",
      justifyContent: "space-between",
      gridColumnGap: scales.spacing[1],
      gridRowGap: scales.spacing[2],
      gridTemplateAreas: templateString,
    },
    [media.mobile]: {
      ...flexRow(),
      ...scroll("x"),
      width: "100%",
    },
  })
  return (
    <div {...css()}>
      <Shortcuts />
      {opList.map((name) => (
        <OpButton key={name} name={name} disabled={isTransitioning} />
      ))}
    </div>
  )
}
