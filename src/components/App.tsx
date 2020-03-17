import React, { Suspense } from "react"
import { Route, Redirect, Switch } from "react-router-dom"

import { choose } from "utils"
import { isValidSolid, allSolidNames } from "data/common"
import { isAlternateName, getCanonicalName } from "data/alternates"
import { isConwaySymbol, fromConwayNotation } from "data/conway"
import { escape } from "utils"

import ErrorPage from "./ErrorPage"
import Loading from "./Loading"

const HomePage = React.lazy(() => import("./HomePage"))
const Viewer = React.lazy(() => import("./Viewer"))

const unescapeName = (name: string) => name.replace(/-/g, " ")

export default () => (
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
          if (isConwaySymbol(solid)) {
            const fullName = escape(fromConwayNotation(solid))
            const newPath = history.location.pathname.replace(
              match.params.solid,
              fullName,
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
            return <Viewer solid={solid} url={match.url} />
          }
          return <ErrorPage />
        }}
      />
    </Switch>
  </Suspense>
)
