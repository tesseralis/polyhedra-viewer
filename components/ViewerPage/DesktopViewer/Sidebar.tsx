import { css } from "@emotion/react"
import { useStyle, scales } from "styles"

import { NavMenu, Panels, useHiddenHeading } from "../common"
import { paddingHoriz, scroll } from "styles/common"

import OperationsPanel from "./OperationsPanel"

interface Props {
  panel: string
  solid: string
  compact?: boolean
}

const menuH = scales.size[3]

export default function Sidebar({ panel, solid, compact }: Props) {
  const [header, focusOnHeader] = useHiddenHeading(panel)

  const navCss = useStyle(
    {
      ...paddingHoriz(scales.spacing[2]),
      gridArea: "menu",
      height: menuH,
      borderBottom: compact ? undefined : "1px solid #333",
    },
    [compact],
  )

  const contentCss = useStyle({
    ...scroll("y"),
    gridArea: "content",
    position: "relative",
  })
  return (
    <section
      css={css`
        width: 100%;
        height: 100%;
        position: relative;
        display: grid;
        grid-template-rows: ${menuH} 1fr;
        grid-template-areas: "menu" "content";
        border-left: ${compact ? undefined : "1px solid #333"};
        background-color: #111;
        color: #999;
      `}
    >
      <div {...navCss()}>
        <NavMenu compact={compact} onClick={focusOnHeader} />
      </div>
      {!compact && (
        <div {...contentCss()}>
          {header}
          <Panels panel={panel} operationsPanel={OperationsPanel} />
        </div>
      )}
    </section>
  )
}
