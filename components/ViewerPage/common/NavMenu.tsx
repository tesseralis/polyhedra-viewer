import { capitalize } from "lodash-es"
import { useRouter } from "next/router"
import React from "react"
import {
  mdiFormatListBulleted,
  mdiInformationOutline,
  mdiCog,
  mdiMathCompass,
  mdiCubeOutline,
} from "@mdi/js"

import { useStyle } from "styles"
import IconLink from "./IconLink"

interface Props {
  compact?: boolean
  onClick(): void
}

const links = [
  { name: "list", icon: mdiFormatListBulleted },
  { name: "info", icon: mdiInformationOutline },
  { name: "options", icon: mdiCog },
  { name: "operations", icon: mdiMathCompass },
  { name: "full", title: "Fullscreen", icon: mdiCubeOutline },
]

export default function NavMenu({ compact = false, onClick }: Props) {
  const router = useRouter()
  const css = useStyle({
    // Using grid here bc it's easier to get evenly spaced than flex
    display: "grid",
    gridTemplateColumns: `repeat(${links.length}, 1fr)`,
    justifyItems: "center",
    width: "100%",
  })

  return (
    <nav {...css()}>
      {links.map(({ name, title = name, icon }) => (
        <IconLink
          key={name}
          replace
          to={`/${router.query.polyhedron}/${name}`}
          title={capitalize(title)}
          iconName={icon}
          iconOnly={compact}
          onClick={onClick}
        />
      ))}
    </nav>
  )
}
