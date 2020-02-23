import React from "react"
import { useStyle, scales } from "styles"

import { ResizeButtons, OpGrid } from "../common"
import { flexColumn } from "styles/common"

export default function OperationsPanel() {
  const css = useStyle({
    ...flexColumn(),
    padding: scales.spacing[3],
    height: "100%",
  })

  const buttonCss = useStyle({ marginTop: "auto" })

  return (
    <section {...css()}>
      <OpGrid />
      <div {...buttonCss()}>
        <ResizeButtons />
      </div>
    </section>
  )
}
