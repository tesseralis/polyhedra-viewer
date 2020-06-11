import { capitalize } from "lodash-es"
import React, { useEffect } from "react"
import { useParams } from "react-router-dom"

import { Polyhedron } from "math/polyhedra"
import { wrapProviders } from "components/common"
import { OperationCtx, TransitionCtx, PolyhedronCtx } from "./context"
import DesktopViewer from "./DesktopViewer"
import MobileViewer from "./MobileViewer"
import { usePageTitle } from "components/common"
import useMediaInfo from "components/useMediaInfo"

interface InnerProps {
  solid: string
  panel: string
  goBack?: boolean
}

function InnerViewer({ solid, panel, goBack = false }: InnerProps) {
  const { unsetOperation } = OperationCtx.useActions()
  const { setPolyhedron } = PolyhedronCtx.useActions()
  useEffect(() => {
    // Whenever we navigate back, unset the operation and reset the polyhedron
    if (goBack) {
      unsetOperation()
      // TODO track the history of the polyhedron states and keep a "stack" of operations
      setPolyhedron(Polyhedron.get(solid))
      // TODO cancel animations when switching panels
      // (I don't think I've ever had that happen so low prio)
    }
  }, [goBack, solid, unsetOperation, setPolyhedron])

  // If we're not on the operations panel, the solid data is determined
  // by the URL.
  useEffect(() => {
    if (panel !== "operations") setPolyhedron(Polyhedron.get(solid))
    // NOTE: do not depend on "panel" here -- if we go from operation -> something else
    // we want to keep the current data.
    // eslint-disable-next-line
  }, [solid, setPolyhedron])

  const { device } = useMediaInfo()

  const ViewerComponent = device === "desktop" ? DesktopViewer : MobileViewer

  return <ViewerComponent solid={solid} panel={panel} />
}

const Providers = wrapProviders([TransitionCtx.Provider, OperationCtx.Provider])

export default function Viewer({ solid }: { solid: string }) {
  const { panel } = useParams()
  // const history = useNavigate()
  // const goBack = history.action === "POP"
  usePageTitle(`${capitalize(solid)} - Polyhedra Viewer`)

  return (
    <PolyhedronCtx.Provider name={solid}>
      <Providers>
        <InnerViewer solid={solid} panel={panel} goBack={false} />
      </Providers>
    </PolyhedronCtx.Provider>
  )
}
