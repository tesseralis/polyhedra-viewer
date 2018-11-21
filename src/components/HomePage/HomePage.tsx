import React, { useEffect } from 'react';

import { styled } from 'styles';
import useMediaInfo from 'components/useMediaInfo';
import { usePageTitle } from 'components/common';

import Markdown from './Markdown';
import TableSection from './TableSection';
import tableSections from './tableSections';
import * as text from './text';
import Masthead from './Masthead';
import ShareLinks from './ShareLinks';

const Container = styled.div({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const Main = styled.main({ width: '100%' });

const Sections = styled.div({ padding: '50px 0' });

const ShareContainer = styled.div({ marginBottom: 20 });

const Footer = styled.footer({
  boxShadow: '1px -1px 4px LightGray',
  width: '100%',
  padding: '20px 50px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
});

interface Props {
  hash?: string;
}

export default function HomePage({ hash = '' }: Props) {
  const { device, orientation } = useMediaInfo();
  const narrow = device === 'mobile' && orientation === 'portrait';

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

  return (
    <Container>
      <Main>
        {/* only play video if we're at the top of the page */}
        <Masthead />
        <Sections>
          {tableSections.map(sectionData => (
            <TableSection
              narrow={narrow}
              key={sectionData.header}
              data={sectionData}
            />
          ))}
        </Sections>
      </Main>
      <Footer>
        <ShareContainer>
          <ShareLinks />
        </ShareContainer>
        <Markdown source={text.footer} />
      </Footer>
    </Container>
  );
}
