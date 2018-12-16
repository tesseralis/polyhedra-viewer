import React, { useEffect } from 'react';

import { useStyle, spacing } from 'styles';
import useMediaInfo from 'components/useMediaInfo';
import { usePageTitle } from 'components/common';

import Markdown from './Markdown';
import TableSection from './TableSection';
import tableSections from './tableSections';
import * as text from './text';
import Masthead from './Masthead';
import ShareLinks from './ShareLinks';
import { flexColumn, paddingVert, padding } from 'styles/common';

function Main() {
  const { device, orientation } = useMediaInfo();
  const narrow = device === 'mobile' && orientation === 'portrait';

  const css = useStyle({ width: '100%' });
  const sections = useStyle(paddingVert(spacing.s4));
  return (
    <main {...css()}>
      <Masthead />
      <div {...sections()}>
        {tableSections.map(sectionData => (
          <TableSection
            narrow={narrow}
            key={sectionData.header}
            data={sectionData}
          />
        ))}
      </div>
    </main>
  );
}

function Footer() {
  const css = useStyle({
    ...flexColumn('center'),
    ...padding(spacing.s4, spacing.s5),
    width: '100%',
    boxShadow: '1px -1px 4px LightGray',
    textAlign: 'center',
  });

  const share = useStyle({ marginBottom: 20 });
  return (
    <footer {...css()}>
      <div {...share()}>
        <ShareLinks />
      </div>
      <Markdown source={text.footer} />
    </footer>
  );
}

interface Props {
  hash?: string;
}

export default function HomePage({ hash = '' }: Props) {
  useEffect(
    () => {
      const el = document.getElementById(hash);
      if (el !== null) {
        el.scrollIntoView(false);
      }
    },
    [hash],
  );

  usePageTitle('Polyhedra Viewer');

  const css = useStyle({
    ...flexColumn('center', 'center'),
    width: '100%',
  });

  return (
    <div {...css()}>
      <Main />
      <Footer />
    </div>
  );
}
