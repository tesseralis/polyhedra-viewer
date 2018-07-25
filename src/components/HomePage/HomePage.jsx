// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { type TableSection as TableSectionType } from 'constants/polyhedronTables';
import { DeviceTracker } from 'components/DeviceContext';

import Markdown from './Markdown';
import TableSection from './TableSection';
import tableSections from './tableSections';
import * as text from './text';
import Masthead from './Masthead';
import ShareLinks from './ShareLinks';

const styles = StyleSheet.create({
  homePage: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  main: {
    width: '100%',
  },

  sections: {
    padding: '50px 0',
  },

  shareLinks: {
    marginBottom: 20,
  },

  footer: {
    boxShadow: '1px -1px 4px LightGray',
    width: '100%',
    padding: '20px 50px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
});

interface Props {
  data: TableSectionType[];
  hash?: string;
  narrow?: boolean;
}

class HomePage extends React.Component<Props> {
  componentDidMount() {
    const { hash = '' } = this.props;
    const el = document.getElementById(hash);
    if (el !== null) {
      el.scrollIntoView(false);
    }
  }

  render() {
    const { data, narrow = false } = this.props;
    return (
      <div className={css(styles.homePage)}>
        <main className={css(styles.main)}>
          {/* only play video if we're at the top of the page */}
          <Masthead />
          <div className={css(styles.sections)}>
            {data.map(sectionData => (
              <TableSection
                narrow={narrow}
                key={sectionData.header}
                data={sectionData}
              />
            ))}
          </div>
        </main>
        <footer className={css(styles.footer)}>
          <div className={css(styles.shareLinks)}>
            <ShareLinks />
          </div>
          <Markdown source={text.footer} />
        </footer>
      </div>
    );
  }
}

export default (props: *) => {
  return (
    <DeviceTracker
      renderDesktop={() => <HomePage {...props} data={tableSections} />}
      renderMobile={({ orientation }) => (
        <HomePage
          {...props}
          narrow={orientation === 'portrait'}
          data={tableSections}
        />
      )}
    />
  );
};
