import { capitalize } from "lodash-es"

import React from "react"
import { Route, Redirect } from "react-router-dom"

import { usePageTitle } from "components/common"
import Viewer from "./Viewer"

interface Props {
  solid: string
  url: string
}

export default function ViewerPage({ solid, url }: Props) {
  usePageTitle(`${capitalize(solid)} - Polyhedra Viewer`)

  return (
    <>
      <Route
        exact
        path={url}
        render={() => <Redirect to={`${url}/operations`} />}
      />
      <Route
        path={`${url}/:panel`}
        render={({ match }) => {
          const { panel } = match.params
          return <Viewer solid={solid} panel={panel ?? ""} />
        }}
      />
    </>
  )
}
