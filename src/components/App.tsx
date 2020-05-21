import React, { Suspense } from "react"
import { Route, Redirect, Switch } from "react-router-dom"

import { choose } from "utils"
import { isValidSolid, allSolidNames } from "data/common"
import { isAlternateName, getCanonicalName } from "data/alternates"
import { isConwayNotation, fromConwayNotation } from "data/conway"
import { escape } from "utils"

import ErrorPage from "./ErrorPage"
import Loading from "./Loading"

const HomePage = React.lazy(() => import("./HomePage"))
const ViewerPage = React.lazy(() => import("./ViewerPage"))

const unescapeName = (name: string) => name.replace(/-/g, " ")

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Switch>
        <Route
          exact
          path="/"
          render={({ location }) => (
            <HomePage hash={location.hash.substring(1)} />
          )}
        />
        <Route
          exact
          path="/random"
          render={() => <Redirect to={escape(choose(allSolidNames))} />}
        />
        <Route
          path="/:solid"
          render={({ match, history }) => {
            const solid = unescapeName(match.params.solid)
            if (isConwayNotation(solid)) {
              const newPath = history.location.pathname.replace(
                match.params.solid,
                escape(fromConwayNotation(solid)),
              )
              return <Redirect to={newPath} />
            }
            if (isAlternateName(solid)) {
              const newPath = history.location.pathname.replace(
                match.params.solid,
                escape(getCanonicalName(solid)),
              )
              return <Redirect to={newPath} />
            }
            if (isValidSolid(solid)) {
              return <ViewerPage solid={solid} url={match.url} />
            }
            return <ErrorPage />
          }}
        />
      </Switch>
    </Suspense>
  )
}
