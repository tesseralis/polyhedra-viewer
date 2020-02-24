import React, { ButtonHTMLAttributes } from "react"
import { useStyle, scales } from "styles"

import { PolyhedronCtx, OperationCtx } from "components/Viewer/context"
import OptionIcon from "./OptionIcon"
import { verdana } from "styles/fonts"
import { hover, square, flexRow, flexColumn } from "styles/common"

const getOptionName = (optValue: string) => {
  switch (optValue) {
    case "U2":
      return "fastigium"
    case "Y4":
      return "pyramid"
    case "U5":
      return "cupola"
    case "R5":
      return "rotunda"
    default:
      return optValue
  }
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  optValue: string
  selected: boolean
}

function OptionButton({ optValue, selected, ...htmlProps }: BtnProps) {
  const css = useStyle(
    {
      ...hover,
      ...square(scales.size[3]),
      border: selected ? "2px DarkSlateGray solid" : "1px LightGray solid",
      backgroundColor: "white",
      fontFamily: verdana,
    },
    [selected],
  )
  return (
    <button {...htmlProps} {...css()}>
      <OptionIcon name={getOptionName(optValue)} />
      {getOptionName(optValue)}
    </button>
  )
}

export default function AugmentOptions() {
  const polyhedron = PolyhedronCtx.useState()
  const { operation, options } = OperationCtx.useState()
  const { setOption } = OperationCtx.useActions()

  const css = useStyle({
    ...flexRow("center", "space-between"),
    width: "100%",
    height: "100%",
  })

  const optionCss = useStyle({
    ...flexColumn(),
    pointerEvents: "initial",
  })

  return (
    <div {...css()}>
      {["gyrate", "using"].map(name => {
        const value = options![name]
        return (
          <div key={name} {...optionCss()}>
            {operation?.allOptions(polyhedron, name).map(optValue => (
              <OptionButton
                key={optValue}
                optValue={optValue}
                onClick={() => setOption(name, optValue)}
                disabled={!value}
                selected={value === optValue}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
