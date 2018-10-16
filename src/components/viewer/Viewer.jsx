// @flow
import _ from 'lodash';
import React, { PureComponent, Fragment } from 'react';
import { Route, Redirect, type RouterHistory } from 'react-router-dom';

import { PageTitle } from 'components/common';
import { OperationProvider, PolyhedronProvider } from './context';
import DesktopViewer from './DesktopViewer';
import MobileViewer from './MobileViewer';
import { DeviceTracker } from 'components/DeviceContext';
import { unescapeName } from 'polyhedra/names';

interface InnerProps {
  solid: string;
  panel: string;
}

class InnerViewer extends PureComponent<InnerProps> {
  render() {
    const { solid, panel } = this.props;
    const pageTitle = `${_.capitalize(unescapeName(solid))} - Polyhedra Viewer`;
    return (
      <Fragment>
        <PageTitle title={pageTitle} />
        {/* <SolidSync solid={solid} panel={panel} /> */}
        <DeviceTracker
          renderDesktop={() => <DesktopViewer solid={solid} panel={panel} />}
          renderMobile={$ => <MobileViewer solid={solid} panel={panel} />}
        />
      </Fragment>
    );
  }
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
              setName={name => history.push(`/${name}/operations`)}
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
