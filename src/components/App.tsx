import React, { Suspense } from "react"
import { Route, Switch } from "react-router-dom"

import usePageTracker from "./usePageTracker"
import Loading from "./Loading"

const HomePage = React.lazy(() => import("./HomePage"))
const ViewerPage = React.lazy(() => import("./ViewerPage"))

export default function App() {
  usePageTracker()
  return (
    <Suspense fallback={<Loading />}>
      <Switch>
        {/* eslint-disable react/no-children-prop */}
        <Route exact path="/" children={<HomePage />} />
        <Route path="/:solid" children={<ViewerPage />} />
      </Switch>
    </Suspense>
  )
}
