// @flow strict
import React from 'react';

import { styled } from 'styles';
import { type TableSection as TableSectionType } from 'math/polyhedra/tables';
import { DeviceTracker } from 'components/DeviceContext';
import { PageTitle } from 'components/common';

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
      <Container>
        <PageTitle title="Polyhedra Viewer" />
        <Main>
          {/* only play video if we're at the top of the page */}
          <Masthead />
          <Sections>
            {data.map(sectionData => (
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
