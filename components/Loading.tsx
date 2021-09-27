import React from "react"

import { useStyle, fonts, scales } from "../styles"

import Icon from "@mdi/react"
import { mdiHexagonOutline } from "@mdi/js"

export default function Loading() {
  const css = useStyle({
    width: "100vw",
    height: "100vh",

    display: "grid",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    gridAutoFlow: "column",
    gridGap: scales.spacing[3],
  })

  const text = useStyle({
    fontFamily: fonts.andaleMono,
    fontSize: scales.font[3],
  })

  return (
    <div {...css()}>
      <Icon size={scales.size[2]} path={mdiHexagonOutline} spin />
      <div {...text()}>Loading...</div>
    </div>
  )
}
