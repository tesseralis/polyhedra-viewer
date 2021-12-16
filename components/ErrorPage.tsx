import Link from "next/link"

import { useStyle, fonts, scales, media } from "styles"
import { link } from "styles/common"
import { usePageTitle } from "components/common"

function Title() {
  const css = useStyle({
    textAlign: "center",
    fontFamily: fonts.andaleMono,
    fontSize: scales.font[3],
    [media.mobile]: {
      fontSize: scales.font[4],
    },
  })
  return <h1 {...css()}>Uh oh! We don't know about that polyhedron!</h1>
}

function BackLink() {
  const css = useStyle({
    fontFamily: fonts.andaleMono as any,
    fontSize: scales.font[4],
    ...link,
  } as any)
  return (
    <Link href="/" passHref>
      <a {...css()}>Go back</a>
    </Link>
  )
}

export default function ErrorPage() {
  usePageTitle("Error - Polyhedra Viewer")
  const css = useStyle({
    width: "100vw",
    height: "100vh",

    display: "grid",
    gridGap: scales.spacing[2],
    alignContent: "center",
    justifyContent: "center",
    justifyItems: "center",
  })

  return (
    <section {...css()}>
      <Title />
      <BackLink />
    </section>
  )
}
