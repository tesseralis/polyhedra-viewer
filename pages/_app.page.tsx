import React from "react"
import Head from "next/head"
import type { AppProps } from "next/app"

import "what-input"
import "styles/reset.css"
import "styles/box-sizing.css"
import "styles/a11y.css"

// the default app
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* FIXME figure out why imports don't work */}
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>Polyhedra Viewer</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}
