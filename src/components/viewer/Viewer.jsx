// @flow
import _ from 'lodash';
// $FlowFixMe
import React, { useEffect, Fragment } from 'react';
import { Route, Redirect, type RouterHistory } from 'react-router-dom';

import { Polyhedron } from 'math/polyhedra';
import { usePageTitle, wrapProviders } from 'components/common';
import {
  OperationCtx,
  TransitionCtx,
  PolyhedronCtx,
  PathSetterProvider,
} from './context';
import DesktopViewer from './DesktopViewer';
import MobileViewer from './MobileViewer';
import useMediaInfo from 'components/useMediaInfo';
import { unescapeName } from 'math/polyhedra/names';

interface InnerProps {
  solid: string;
  panel: string;
  action: string;
}

function InnerViewer({ solid, panel, action }: InnerProps) {
  const { unsetOperation } = OperationCtx.useActions();
  const { setPolyhedron } = PolyhedronCtx.useActions();
  usePageTitle(`${_.capitalize(unescapeName(solid))} - Polyhedra Viewer`);

  const nonOperation = panel !== 'operations' || action === 'POP';
  useEffect(
    () => {
      if (nonOperation) {
        unsetOperation();
        // TODO cancel animations when switching panels
        // (I don't think I've ever had that happen so low prio)
      }
    },
    [panel, action],
  );

  useEffect(
    () => {
      if (nonOperation) setPolyhedron(Polyhedron.get(solid));
    },
    // Make sure we don't reset the polyhedron if we just change panels.
    // If this is just [action], it'll be called when switching because action
    // goes from 'PUSH' to 'REPLACE'
    // TODO this is really hacky and I dunno how to test this find something better
    [solid, action === 'POP'],
  );

  const { device } = useMediaInfo();

  const Viewer = device === 'desktop' ? DesktopViewer : MobileViewer;

  return <Viewer solid={solid} panel={panel} />;
}

interface Props {
  solid: string;
  url: string;
  history: RouterHistory;
}

const Providers = wrapProviders([
  TransitionCtx.Provider,
  OperationCtx.Provider,
  PathSetterProvider,
]);

export default function Viewer({ solid, history, url }: Props) {
  return (
    <Fragment>
      <Route
        exact
        path={url}
        render={() => <Redirect to={`${url}/operations`} />}
      />
      <Route
        path={`${url}/:panel`}
        render={({ match, history }) => {
          const { panel } = match.params;

          return (
            <PolyhedronCtx.Provider name={solid}>
              <Providers>
                <InnerViewer
                  action={history.action}
                  solid={solid}
                  panel={panel || ''}
                />
              </Providers>
            </PolyhedronCtx.Provider>
          );
        }}
      />
    </Fragment>
  );
}
