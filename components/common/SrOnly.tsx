import { css } from "@emotion/react"
import { ChildrenProp } from "lib/types"

export default function SrOnly({ children }: ChildrenProp) {
  return (
    <span
      css={css`
        height: 1;
        width: 1;
        position: absolute;
        overflow: hidden;
        clip: rect(1px, 1px, 1px, 1px);
      `}
    >
      {children}
    </span>
  )
}
