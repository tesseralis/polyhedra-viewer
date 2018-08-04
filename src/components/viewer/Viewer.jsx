// @flow
import _ from 'lodash';
import React, { PureComponent, Fragment } from 'react';
import { Route, Redirect, type RouterHistory } from 'react-router-dom';

import { PageTitle } from 'components/common';
import { OperationProvider, PolyhedronProvider } from './context';
import DesktopViewer from './DesktopViewer';
import MobileViewer from './MobileViewer';
import { DeviceTracker } from 'components/DeviceContext';
import SolidSync from './SolidSync';
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
        <SolidSync solid={solid} panel={panel} />
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
    <PolyhedronProvider
      name={solid}
      setName={name => history.push(`/${name}/operations`)}
    >
      <OperationProvider>
        <Route
          exact
          path={url}
          render={() => <Redirect to={`${url}/operations`} />}
        />
        <Route
          path={`${url}/:panel`}
          render={({ match, history }) => (
            <InnerViewer solid={solid} panel={match.params.panel || ''} />
          )}
        />
      </OperationProvider>
    </PolyhedronProvider>
  );
}
