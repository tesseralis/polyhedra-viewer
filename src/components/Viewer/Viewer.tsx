import _ from 'lodash';

import React, { useEffect } from 'react';
import { History } from 'history';
import { Route, Redirect } from 'react-router-dom';

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

  // TODO I wish we could make this less verbose...

  // Unset operation if we move away from the operations panel
  useEffect(
    () => {
      if (panel !== 'operations' || action === 'POP') {
        unsetOperation();
        // TODO cancel animations when switching panels
        // (I don't think I've ever had that happen so low prio)
      }
    },
    [panel, action],
  );

  // If we're not on the operations panel, the solid data is determined
  // by the URL.
  // NOTE: do not depend on "panel" here -- if we go from operation -> something else
  // we want to keep the current data.
  useEffect(
    () => {
      if (panel !== 'operations') setPolyhedron(Polyhedron.get(solid));
    },
    [solid],
  );

  // Reset the polyhedron whenever we go back.
  // We may replace this with a "stack".
  useEffect(
    () => {
      if (action === 'POP') setPolyhedron(Polyhedron.get(solid));
    },
    [solid, action],
  );

  const { device } = useMediaInfo();

  const Viewer = device === 'desktop' ? DesktopViewer : MobileViewer;

  return <Viewer solid={solid} panel={panel} />;
}

interface Props {
  solid: string;
  url: string;
  history: History;
}

const Providers = wrapProviders([
  TransitionCtx.Provider,
  OperationCtx.Provider,
  PathSetterProvider,
]);

export default function Viewer({ solid, history, url }: Props) {
  return (
    <>
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
    </>
  );
}
