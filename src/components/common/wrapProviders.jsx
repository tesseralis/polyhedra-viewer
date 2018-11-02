// @flow strict
import React from 'react';
import _ from 'lodash';

function wrapProvider(Provider, children) {
  return <Provider>{children}</Provider>;
}

export default function wrapProviders(providers: *[]) {
  return ({ children }: *) =>
    _.reduceRight(
      providers,
      (wrapped, provider) => wrapProvider(provider, wrapped),
      children,
    );
}
