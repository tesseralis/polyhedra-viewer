//@flow

import React, { Fragment } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { absolute } from 'styles/common';
import MobileTracker from 'components/MobileTracker';
import { unescapeName } from 'polyhedra/names';
import IconLink from 'components/Viewer/IconLink';
import Title from './Title';
import Options from './Options';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    right: 0,
    left: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },

  title: {
    ...absolute('bottom', 'right'),
    pointerEvents: 'initial',
    padding: 36,
    maxWidth: '50%',
    textAlign: 'right',
  },

  homeLink: {
    pointerEvents: 'initial',
    ...absolute('top', 'left'),
  },
});

interface Props {
  solid: string;
}

export default function Overlay({ solid }: Props) {
  return (
    <div className={css(styles.overlay)}>
      <MobileTracker
        renderDesktop={() => (
          <Fragment>
            <div className={css(styles.homeLink)}>
              <IconLink
                iconName="periodic-table"
                title="Table"
                replace
                to="/"
              />
            </div>
            <div className={css(styles.title)}>
              <Title name={unescapeName(solid)} />
            </div>
          </Fragment>
        )}
      />
      <Options solid={solid} />
    </div>
  );
}
