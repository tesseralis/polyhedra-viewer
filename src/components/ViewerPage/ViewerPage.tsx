import React from "react"
import {
  Switch,
  Route,
  Redirect,
  useRouteMatch,
  useLocation,
} from "react-router-dom"

import { escape, choose } from "utils"
import { isValidSolid, allSolidNames } from "data/common"
import { isAlternateName, getCanonicalName } from "data/alternates"
import { isConwayNotation, fromConwayNotation } from "data/conway"

import ErrorPage from "components/ErrorPage"
import Viewer from "./Viewer"

const unescapeName = (name: string) => name.replace(/-/g, " ")

function resolveSolidName(solid: string) {
  if (solid === "random") {
    return choose(allSolidNames)
  }
  if (isConwayNotation(solid)) {
    return fromConwayNotation(solid)
  }
  if (isAlternateName(solid)) {
    return getCanonicalName(solid)
  }
  if (isValidSolid(solid)) {
    return solid
  }
  return null
}

export default function ViewerPage() {
  const { params, url } = useRouteMatch<{ solid: string }>()
  const { pathname } = useLocation()
  const solidParam = unescapeName(params.solid)
  const solid = resolveSolidName(solidParam)

  if (!solid) {
    return <ErrorPage />
  }

  if (solid !== solidParam) {
    return <Redirect to={pathname.replace(params.solid, escape(solid))} />
  }

  return (
    <Switch>
      {/* eslint-disable react/no-children-prop */}
      <Route
        exact
        path={url}
        children={<Redirect to={`${url}/operations`} />}
      />
      <Route path={`${url}/:panel`} children={<Viewer solid={solid} />} />
    </Switch>
  )
}
