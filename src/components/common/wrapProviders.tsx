import React, { ReactType, ReactChild, FunctionComponent } from 'react';
import _ from 'lodash';

function wrapProvider(Provider: ReactType, children: ReactChild) {
  return <Provider>{children}</Provider>;
}

export default function wrapProviders(
  providers: ReactType[],
): FunctionComponent {
  return ({ children }: any) =>
    _.reduceRight(
      providers,
      (wrapped, provider) => wrapProvider(provider, wrapped),
      children,
    );
}
