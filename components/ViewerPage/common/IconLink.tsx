import Link from "next/link"
import { useStyle, scales } from "styles"
import Icon from "@mdi/react"

import { media, fonts } from "styles"
import { SrOnly } from "components/common"
import { colorFill, flexColumn } from "styles/common"

function LinkText({ text, hidden }: { text: string; hidden: boolean }) {
  const css = useStyle({
    marginTop: scales.spacing[1],
    fontSize: scales.font[7],
    fontFamily: fonts.verdana,

    [media.mobileLandscape]: {
      marginTop: 0,
      paddingLeft: scales.spacing[1],
    },
  })
  return hidden ? <SrOnly>{text}</SrOnly> : <div {...css()}>{text}</div>
}

export default function IconLink({
  iconName,
  title,
  to,
  replace,
  onClick,
  iconOnly = false,
}: any) {
  const css = useStyle({
    ...flexColumn("center"),
    ...colorFill("#999"),
    textDecoration: "none",
    padding: scales.spacing[2],

    [media.mobileLandscape]: {
      padding: 0,
      flexDirection: "row",
    },
  } as any)

  const activeCss = useStyle(colorFill("DarkSlateGray") as any)

  // FIXME active styles
  return (
    <Link href={to} replace={replace} passHref>
      <a {...css()} {...activeCss("activeClassName")} onClick={onClick}>
        <Icon path={iconName} size={scales.size[2]} />
        <LinkText text={title} hidden={iconOnly} />
      </a>
    </Link>
  )
}
