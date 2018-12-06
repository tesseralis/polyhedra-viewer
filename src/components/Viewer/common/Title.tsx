import _ from 'lodash';
import React from 'react';
import { useStyle } from 'styles';

import { unescapeName } from 'math/polyhedra/names';
import { media, fonts } from 'styles';

function Title({ name }: { name: string }) {
  const css = useStyle({
    fontFamily: fonts.andaleMono,
    fontSize: 32,
    fontWeight: 'bold',

    // TODO consider making this style-less and defining the styles
    // in mobile/desktop viewers
    [media.mobile]: {
      fontFamily: fonts.times,
      fontWeight: 'initial',
      fontSize: 18,
      textAlign: 'center',
    },
  });
  return <h1 {...css()}>{_.capitalize(unescapeName(name))}</h1>;
}

export default Title;
