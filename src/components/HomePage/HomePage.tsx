import React, { useEffect } from 'react';

import { useStyle } from 'styles';
import useMediaInfo from 'components/useMediaInfo';
import { usePageTitle } from 'components/common';

import Markdown from './Markdown';
import TableSection from './TableSection';
import tableSections from './tableSections';
import * as text from './text';
import Masthead from './Masthead';
import ShareLinks from './ShareLinks';

function Main() {
  const { device, orientation } = useMediaInfo();
  const narrow = device === 'mobile' && orientation === 'portrait';

  const css = useStyle({ width: '100%' });
  const sections = useStyle({ padding: '50px 0' });
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
    boxShadow: '1px -1px 4px LightGray',
    width: '100%',
    padding: '20px 50px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  });

  return (
    <div {...css()}>
      <Main />
      <Footer />
    </div>
  );
}
