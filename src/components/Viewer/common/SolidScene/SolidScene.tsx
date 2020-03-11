import { pick } from "lodash-es"
import React from "react"
import X3dScene from "./X3dScene"
import X3dPolyhedron from "./X3dPolyhedron"

import useSolidContext from "./useSolidContext"
import useHitOptions from "./useHitOptions"
import Config from "components/ConfigCtx"

export default ({ label }: { label: string }) => {
  const { colors, solidData } = useSolidContext()
  const config = Config.useState()
  const { setHitOption, unsetHitOption, applyWithHitOption } = useHitOptions()

  return (
    <X3dScene label={label}>
      <X3dPolyhedron
        value={solidData}
        colors={colors}
        config={pick(config, [
          "showFaces",
          "showEdges",
          "showInnerFaces",
          "opacity",
        ])}
        onHover={setHitOption}
        onMouseOut={unsetHitOption}
        onClick={applyWithHitOption}
      />
    </X3dScene>
  )
}
