import React, { Suspense } from "react"
import { Route, Redirect, Switch } from "react-router-dom"

import { isValidSolid } from "data"
import {
  escapeName,
  unescapeName,
  randomSolidName,
  isConwaySymbol,
  fromConwayNotation,
  isAlternateName,
  getCanonicalName,
} from "data/names"

import ErrorPage from "./ErrorPage"
import Loading from "./Loading"

const HomePage = React.lazy(() => import("./HomePage"))
const Viewer = React.lazy(() => import("./Viewer"))

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
        render={() => <Redirect to={escapeName(randomSolidName())} />}
      />
      <Route
        path="/:solid"
        render={({ match, history }) => {
          const solid = unescapeName(match.params.solid)
          if (isConwaySymbol(solid)) {
            const fullName = escapeName(fromConwayNotation(solid))
            const newPath = history.location.pathname.replace(
              match.params.solid,
              fullName,
            )
            return <Redirect to={newPath} />
          }
          if (isAlternateName(solid)) {
            const newPath = history.location.pathname.replace(
              match.params.solid,
              escapeName(getCanonicalName(solid)),
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
