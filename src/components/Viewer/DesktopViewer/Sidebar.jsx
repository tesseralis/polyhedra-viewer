// @flow
import React, { Component } from 'react';
import { makeStyles } from 'styles';

import { SrOnly } from 'components/common';
import { NavMenu, Panels } from '../common';
import { scroll } from 'styles/common';

import OperationsPanel from './OperationsPanel';

const menuH = 75;
const styles = makeStyles({
  sidebar: {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'grid',
    gridTemplateRows: `${menuH}px 1fr`,
    gridTemplateAreas: '"menu" "content"',
  },
  full: {
    boxShadow: 'inset 1px -1px 4px LightGray',
  },
  menu: {
    gridArea: 'menu',
    height: menuH,
    padding: '0 10px',
  },
  menuFull: {
    borderBottom: '1px solid LightGray',
  },

  content: {
    ...scroll('y'),
    gridArea: 'content',
    position: 'relative',
  },
});

interface Props {
  panel: string;
  solid: string;
  compact?: boolean;
}

export default class Sidebar extends Component<Props> {
  header: *;

  constructor(props: Props) {
    super(props);
    this.header = React.createRef();
  }

  render() {
    const { compact, panel, solid } = this.props;
    return (
      <section className={styles('sidebar', !compact && 'full')}>
        <div className={styles('menu', !compact && 'menuFull')}>
          <NavMenu
            solid={solid}
            compact={!!compact}
            onClick={this.focusOnHeader}
          />
        </div>
        {!compact && (
          <div className={styles('content')}>
            <SrOnly>
              <h2 tabIndex={0} ref={this.header}>
                {panel}
              </h2>
            </SrOnly>
            <Panels panel={panel} operationsPanel={OperationsPanel} />
          </div>
        )}
      </section>
    );
  }

  // TODO dedupe with mobile
  focusOnHeader = () => {
    if (this.header.current) {
      this.header.current.focus();
    }
  };
}
