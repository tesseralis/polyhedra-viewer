import React from "react"
import { Link } from "react-router-dom"

import { useStyle, fonts, scales, media } from "../styles"
import { square, link } from "../styles/common"
import image from "images/sad-scutoid.png"
import { usePageTitle } from "components/common"

function Image() {
  const css = useStyle(square(scales.size[5]))
  return <img {...css()} src={image} alt="" />
}

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
    fontFamily: fonts.andaleMono,
    fontSize: scales.font[4],
    ...link,
  })
  return (
    <Link {...css()} to="/">
      Go back
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
      <Image />
      <Title />
      <BackLink />
    </section>
  )
}
