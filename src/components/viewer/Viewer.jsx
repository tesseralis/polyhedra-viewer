// @flow
import _ from 'lodash';
import React, { PureComponent, Fragment } from 'react';
import { type RouterHistory } from 'react-router-dom';

import { PageTitle } from 'components/common';
import { OperationProvider, PolyhedronProvider } from './context';
import DesktopViewer from './DesktopViewer';
import MobileViewer from './MobileViewer';
import { DeviceTracker } from 'components/DeviceContext';
import SolidSync from './SolidSync';
import { unescapeName } from 'polyhedra/names';

interface ViewerProps {
  solid: string;
  history: RouterHistory;
}

class Viewer extends PureComponent<*> {
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

export default (props: ViewerProps) => (
  <PolyhedronProvider
    name={props.solid}
    setName={name => props.history.push(`/${name}/operations`)}
  >
    <OperationProvider>
      <Viewer {...props} />
    </OperationProvider>
  </PolyhedronProvider>
);
