import _ from 'lodash';
import React from 'react';
import { useStyle, fontSizes } from 'styles';

import { unescapeName } from 'math/polyhedra/names';
import { media, fonts } from 'styles';

function Title({ name }: { name: string }) {
  const css = useStyle({
    fontFamily: fonts.andaleMono,
    fontSize: fontSizes.f2,
    fontWeight: 'bold',
    textAlign: 'left',

    [media.tabletPortrait]: {
      fontSize: fontSizes.f3,
    },

    // TODO consider making this style-less and defining the styles
    // in mobile/desktop viewers
    [media.mobile]: {
      fontFamily: fonts.times,
      fontWeight: 'initial',
      fontSize: fontSizes.f4,
      lineHeight: 1.25,
      textAlign: 'center',
    },
  });
  return <h1 {...css()}>{_.capitalize(unescapeName(name))}</h1>;
}

export default Title;
