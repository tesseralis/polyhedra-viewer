// @flow strict
import React from 'react';

import IconLink from './IconLink';

interface Props { solid: string }

export default function BackLink({ solid }: Props) {
  return (
    <IconLink
      iconOnly
      iconName="chevron-left"
      title="Back"
      to={{
        pathname: '/',
        hash: solid,
      }}
    />
  );
}
