import Link from "next/link"

import { css } from "@emotion/react"
import { fonts, scales, media } from "styles"
import { usePageTitle } from "components/common"

function Title() {
  return (
    <h1
      css={css`
        color: #999;
        text-align: center;
        font-family: ${fonts.andaleMono};
        font-size: ${scales.font[3]};
        ${media.mobile} {
          font-size: ${scales.font[4]};
        }
      `}
    >
      Uh oh! We don't know about that polyhedron!
    </h1>
  )
}

function BackLink() {
  return (
    <Link href="/" passHref>
      <a
        css={css`
          font-family: ${fonts.andaleMono};
          font-size: ${scales.font[4]};
          color: #ccc;
        `}
      >
        Go back
      </a>
    </Link>
  )
}

export default function ErrorPage() {
  usePageTitle("Error - Polyhedra Viewer")
  return (
    <section
      css={css`
        width: 100vw;
        height: 100vh;

        display: grid;
        gap: ${scales.spacing[2]};
        align-content: center;
        justify-content: center;
        justify-items: center;

        background-color: #111;
      `}
    >
      <Title />
      <BackLink />
    </section>
  )
}
