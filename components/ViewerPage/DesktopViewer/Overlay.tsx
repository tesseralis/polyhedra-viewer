//@flow

import React from "react"
import { useStyle, scales } from "../styles"

import { absolute, absoluteFull, paddingHoriz } from "../styles/common"
import { BackLink, Title, Options, Prompt } from "../common"

interface Props {
  solid: string
}

// TODO replace all the padding/absolute values with Grid
export default function Overlay({ solid }: Props) {
  const css = useStyle({
    ...absoluteFull,
    pointerEvents: "none",
  })

  const title = useStyle({
    ...absolute("bottom", "left"),
    pointerEvents: "initial",
    padding: scales.spacing[4],
  })

  const homeLink = useStyle({
    ...absolute("top", "left"),
    pointerEvents: "initial",
    paddingLeft: scales.spacing[2],
  })

  const options = useStyle({
    ...paddingHoriz(scales.spacing[4]),
    height: "100%",
  })

  const prompt = useStyle({
    paddingTop: scales.spacing[3],
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
  })

  return (
    <div {...css()}>
      <div {...homeLink()}>
        <BackLink solid={solid} />
      </div>
      <div {...title()}>
        <Title name={solid} />
      </div>
      <div {...prompt()}>
        <Prompt />
      </div>
      <div {...options()}>
        <Options />
      </div>
    </div>
  )
}
