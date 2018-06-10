// @flow
import React, { PureComponent, Fragment } from 'react';
import { type RouterHistory } from 'react-router-dom';

import { OperationProvider, PolyhedronProvider } from './context';
import DesktopViewer from './DesktopViewer';
import MobileViewer from './MobileViewer';
import MobileTracker from 'components/MobileTracker';
import SolidSync from './SolidSync';

interface ViewerProps {
  solid: string;
  history: RouterHistory;
}

class Viewer extends PureComponent<*> {
  render() {
    const { solid, panel } = this.props;
    return (
      <Fragment>
        <SolidSync solid={solid} panel={panel} />
        <MobileTracker
          renderDesktop={() => <DesktopViewer solid={solid} panel={panel} />}
          renderMobile={() => <MobileViewer solid={solid} panel={panel} />}
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
