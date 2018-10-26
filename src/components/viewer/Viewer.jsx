// @flow
import _ from 'lodash';
import React, { Fragment } from 'react';
import { Route, Redirect, type RouterHistory } from 'react-router-dom';

import { usePageTitle } from 'components/common';
import { OperationProvider, PolyhedronProvider } from './context';
import DesktopViewer from './DesktopViewer';
import MobileViewer from './MobileViewer';
import { DeviceTracker } from 'components/DeviceContext';
import { escapeName, unescapeName } from 'math/polyhedra/names';

interface InnerProps {
  solid: string;
  panel: string;
}

// TODO this used to be a pure component -- check if perf is okay!
function InnerViewer({ solid, panel }: InnerProps) {
  usePageTitle(`${_.capitalize(unescapeName(solid))} - Polyhedra Viewer`);

  return (
    <Fragment>
      <DeviceTracker
        renderDesktop={() => <DesktopViewer solid={solid} panel={panel} />}
        renderMobile={$ => <MobileViewer solid={solid} panel={panel} />}
      />
    </Fragment>
  );
}

interface Props {
  solid: string;
  url: string;
  history: RouterHistory;
}

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
          const { panel = '' } = match.params;
          return (
            <PolyhedronProvider
              name={solid}
              setName={name => history.push(`/${escapeName(name)}/operations`)}
              disabled={panel !== 'operations' || history.action === 'POP'}
            >
              <OperationProvider disabled={panel !== 'operations'}>
                <InnerViewer solid={solid} panel={panel || ''} />
              </OperationProvider>
            </PolyhedronProvider>
          );
        }}
      />
    </Fragment>
  );
}
