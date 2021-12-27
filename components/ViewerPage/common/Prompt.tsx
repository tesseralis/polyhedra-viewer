import { scales } from "styles"
import { css } from "@emotion/react"

import { media, fonts } from "styles"
import { OperationCtx } from "components/ViewerPage/context"

function getMessage(opName: string) {
  switch (opName) {
    case "augment":
      return "Select a face"
    case "diminish":
    case "gyrate":
      return "Select a component"
    case "sharpen":
    case "contract":
      return "Select a type of face"
    default:
      return null
  }
}

export default function Prompt() {
  const { operation } = OperationCtx.useState()
  if (!operation) return null
  const message = getMessage(operation.name)

  return (
    message && (
      <div
        css={css`
          font-size: ${scales.font[3]};
          font-family: ${fonts.andaleMono};
          text-align: center;

          ${media.mobile} {
            font-size: ${scales.font[4]};
          }
        `}
      >
        {message}
      </div>
    )
  )
}
