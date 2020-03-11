import React from "react"
import { useStyle, scales, media } from "styles"
import { capitalize } from "lodash-es"

import { fonts } from "styles"

import { PolyhedronCtx } from "components/Viewer/context"
import DataDownloader from "../DataDownloader"
import { flexColumn } from "styles/common"

import { RenderProps } from "./renderFuncs"
import DataList from "./DataList"

function Heading({ polyhedron }: RenderProps) {
  const css = useStyle({
    fontSize: scales.font[3],
    marginBottom: scales.spacing[1],
    lineHeight: 1.25,
  })
  return (
    <h2 {...css()}>
      {capitalize(polyhedron.name)} | {polyhedron.symbol()}
    </h2>
  )
}

export default function InfoPanel() {
  const polyhedron = PolyhedronCtx.useState()

  const css = useStyle({
    ...flexColumn(),
    borderSpacing: 8,
    borderCollapse: "separate",
    padding: scales.spacing[3],
    fontFamily: fonts.times,

    // On non-mobile, display the download links on the bottom
    [media.notMobile]: { height: "100%" },
  })

  const typeCss = useStyle({
    fontSize: scales.font[5],
    color: "DimGrey",
    marginBottom: scales.spacing[3],
  })

  const downloaderCss = useStyle({
    [media.mobile]: { marginTop: scales.spacing[4] },
    [media.notMobile]: { marginTop: "auto" },
  })

  return (
    <div {...css()}>
      <Heading polyhedron={polyhedron} />
      <p {...typeCss()}>{polyhedron.type()}</p>
      <DataList polyhedron={polyhedron} />
      <div {...downloaderCss()}>
        <DataDownloader solid={polyhedron.solidData} />
      </div>
    </div>
  )
}
