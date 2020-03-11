import React, { ReactType, ReactChild, FunctionComponent } from "react"
import { reduceRight } from "lodash-es"

function wrapProvider(Provider: ReactType, children: ReactChild) {
  return <Provider>{children}</Provider>
}

export default function wrapProviders(
  providers: ReactType[],
): FunctionComponent {
  return ({ children }: any) =>
    reduceRight(
      providers,
      (wrapped, provider) => wrapProvider(provider, wrapped),
      children,
    )
}
