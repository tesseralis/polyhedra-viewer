import { capitalize } from "lodash-es"

import React, { useEffect } from "react"
import { Route, Redirect } from "react-router-dom"

import { Polyhedron } from "math/polyhedra"
import { usePageTitle, wrapProviders } from "components/common"
import { OperationCtx, TransitionCtx, PolyhedronCtx } from "./context"
import DesktopViewer from "./DesktopViewer"
import MobileViewer from "./MobileViewer"
import useMediaInfo from "components/useMediaInfo"

interface InnerProps {
  solid: string
  panel: string
  action: string
}

function InnerViewer({ solid, panel, action }: InnerProps) {
  const { unsetOperation } = OperationCtx.useActions()
  const { setPolyhedron } = PolyhedronCtx.useActions()
  usePageTitle(`${capitalize(solid)} - Polyhedra Viewer`)

  useEffect(() => {
    // Whenever we navigate back, unset the operation and reset the polyhedron
    if (action === "POP") {
      unsetOperation()
      // TODO track the history of the polyhedron states and keep a "stack" of operations
      setPolyhedron(Polyhedron.get(solid))
      // TODO cancel animations when switching panels
      // (I don't think I've ever had that happen so low prio)
    }
  }, [action, solid, unsetOperation, setPolyhedron])

  // If we're not on the operations panel, the solid data is determined
  // by the URL.
  useEffect(() => {
    if (panel !== "operations") setPolyhedron(Polyhedron.get(solid))
    // NOTE: do not depend on "panel" here -- if we go from operation -> something else
    // we want to keep the current data.
    // eslint-disable-next-line
  }, [solid, setPolyhedron])

  const { device } = useMediaInfo()

  const Viewer = device === "desktop" ? DesktopViewer : MobileViewer

  return <Viewer solid={solid} panel={panel} />
}

interface Props {
  solid: string
  url: string
}

const Providers = wrapProviders([TransitionCtx.Provider, OperationCtx.Provider])

export default function Viewer({ solid, url }: Props) {
  return (
    <>
      <Route
        exact
        path={url}
        render={() => <Redirect to={`${url}/operations`} />}
      />
      <Route
        path={`${url}/:panel`}
        render={({ match, history }) => {
          const { panel } = match.params

          return (
            <PolyhedronCtx.Provider name={solid}>
              <Providers>
                <InnerViewer
                  action={history.action}
                  solid={solid}
                  panel={panel ?? ""}
                />
              </Providers>
            </PolyhedronCtx.Provider>
          )
        }}
      />
    </>
  )
}
