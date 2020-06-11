import React from "react"
import { BrowserRouter } from "react-router-dom"

import { wrapProviders } from "components/common"
import { DeviceProvider } from "./useMediaInfo"
import ConfigCtx from "./ConfigCtx"
import usePageTracker from "./usePageTracker"

import App from "./App"
const Providers = wrapProviders([
  BrowserRouter,
  DeviceProvider,
  ConfigCtx.Provider,
])

export default function Root() {
  usePageTracker()

  return (
    <Providers>
      <App />
    </Providers>
  )
}
