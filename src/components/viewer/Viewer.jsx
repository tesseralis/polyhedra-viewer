// @flow
import _ from 'lodash';
import React, { Fragment } from 'react';
import { Route, Redirect, type RouterHistory } from 'react-router-dom';

import { usePageTitle } from 'components/common';
import {
  OperationProvider,
  PolyhedronProvider,
  TransitionProvider,
} from './context';
import DesktopViewer from './DesktopViewer';
import MobileViewer from './MobileViewer';
import useMediaInfo from 'components/useMediaInfo';
import { escapeName, unescapeName } from 'math/polyhedra/names';

interface InnerProps {
  solid: string;
  panel: string;
}

// TODO this used to be a pure component -- check if perf is okay!
function InnerViewer({ solid, panel }: InnerProps) {
  usePageTitle(`${_.capitalize(unescapeName(solid))} - Polyhedra Viewer`);

  const { device } = useMediaInfo();

  const Viewer = device === 'desktop' ? DesktopViewer : MobileViewer;

  return <Viewer solid={solid} panel={panel} />;
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
          const { panel } = match.params;
          const disabled = panel !== 'operations' || history.action === 'POP';
          return (
            <PolyhedronProvider
              name={solid}
              setName={name => history.push(`/${escapeName(name)}/operations`)}
              disabled={disabled}
            >
              <TransitionProvider disabled={disabled}>
                <OperationProvider disabled={disabled}>
                  <InnerViewer solid={solid} panel={panel || ''} />
                </OperationProvider>
              </TransitionProvider>
            </PolyhedronProvider>
          );
        }}
      />
    </Fragment>
  );
}
