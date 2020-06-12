import React from "react"
import { mdiChevronLeft } from "@mdi/js"
import { escape } from "utils"

import IconLink from "./IconLink"

interface Props {
  solid: string
}

export default function BackLink({ solid }: Props) {
  return (
    <IconLink
      iconOnly
      iconName={mdiChevronLeft}
      title="Back"
      to={`/#${escape(solid)}`}
    />
  )
}
