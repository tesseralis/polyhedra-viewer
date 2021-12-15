import React from "react"
import Link from "next/link"

import { escape } from "lib/utils"
import { square, hover, flexRow } from "styles/common"
import { useStyle, media } from "styles"
import { PolyhedronSpecs } from "specs"

interface Props {
  specs: PolyhedronSpecs
  isDuplicate: boolean
}

// using raw pixel values since we need to do math
const thumbnailSize = 64
const mobThumbnailSize = 48

function Image({ name }: { name: string }) {
  const css = useStyle({
    ...flexRow("center", "center"),
    [media.notMobile]: {
      height: thumbnailSize,
    },
    [media.mobile]: {
      height: mobThumbnailSize,
    },
  } as any)
  const escapedName = escape(name)
  return (
    <img
      {...css()}
      alt={name}
      src={require(`images/thumbnails/${escapedName}.png`)}
    />
  )
}

export default function PolyhedronLink({ specs, isDuplicate }: Props) {
  const escapedName = escape(specs.name())

  const css = useStyle(
    {
      ...hover,
      ...(isDuplicate ? { opacity: 0.5, filter: "grayscale(50%)" } : {}),
      ...flexRow("center", "center"),
      border: "1px LightGray solid",
      color: "black",
      overflow: "hidden",
      margin: "auto", // center inside a table
      borderRadius: ".5rem",
      [media.notMobile]: square(thumbnailSize),
      [media.mobile]: square(mobThumbnailSize),
    } as any,
    [isDuplicate],
  )
  return (
    <Link href={"/" + escapedName} passHref>
      <a
        id={!isDuplicate ? escapedName : undefined}
        title={specs.name()}
        {...css()}
      >
        <Image name={escape(specs.canonicalName())} />
      </a>
    </Link>
  )
}
