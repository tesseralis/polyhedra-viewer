import Link from "next/link"

import { SrOnly, ExternalLink } from "components/common"
import Markdown from "./Markdown"
import { useStyle, media, fonts, scales } from "styles"
import * as text from "./text"
import video from "images/transitions.mp4"
import { flexRow, flexColumn, padding, link } from "styles/common"

const videoHeight = 300

function VideoLink() {
  const css = useStyle({
    ...flexRow(undefined, "center"),
    // make smaller to hide weird video artifacts
    height: videoHeight - 2,
    width: videoHeight - 2,
    overflow: "hidden",
  } as any)
  return (
    <Link href="/random" passHref>
      <a {...css()}>
        <SrOnly>View random polyhedron</SrOnly>
        <video muted autoPlay playsInline src={video} height={videoHeight} />
      </a>
    </Link>
  )
}

function Title() {
  const css = useStyle({
    marginBottom: scales.spacing[2],
    fontSize: scales.font[2],
    textAlign: "center",
    fontWeight: "bold",
    fontFamily: fonts.andaleMono,

    [media.mobile]: {
      fontSize: scales.font[3],
    },
  })
  return <h1 {...css()}>Polyhedra Viewer</h1>
}

function Subtitle() {
  const css = useStyle({
    fontSize: scales.font[5],
    fontFamily: fonts.andaleMono,
    marginBottom: scales.spacing[3],
    fontColor: "DimGray",
  })

  const author = useStyle(link as any)

  return (
    <p {...css()}>
      by{" "}
      <ExternalLink {...author()} href="https://www.tessera.li">
        @tesseralis
      </ExternalLink>
    </p>
  )
}

function Abstract() {
  const css = useStyle({
    ...flexColumn("center"),
    maxWidth: scales.size[6],
  } as any)
  return (
    <div {...css()}>
      <Title />
      <Subtitle />
      <Markdown source={text.abstract} />
    </div>
  )
}

export default function Masthead() {
  const css = useStyle({
    ...padding(scales.spacing[4], scales.spacing[5]),
    ...flexRow("center", "center"),
    width: "100%",
    borderBottom: "1px solid LightGray",

    [media.mobilePortrait]: {
      flexDirection: "column-reverse",
    },
  } as any)

  return (
    <div {...css()}>
      <Abstract />
      <VideoLink />
    </div>
  )
}