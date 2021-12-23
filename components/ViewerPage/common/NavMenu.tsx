import { css } from "@emotion/react"
import { capitalize } from "lodash-es"
import { useRouter } from "next/router"

import {
  mdiFormatListBulleted,
  mdiInformationOutline,
  mdiCog,
  mdiMathCompass,
  mdiCubeOutline,
} from "@mdi/js"

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
  return (
    <nav
      css={css`
        display: grid;
        grid-template-columns: repeat(${links.length}, 1fr);
        justify-items: center;
        width: 100%;
      `}
    >
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
