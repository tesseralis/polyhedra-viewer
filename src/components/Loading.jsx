import React from 'react';

import { styled } from 'styles';
import { fonts } from 'styles';

import Icon from '@mdi/react';
import { mdiHexagonOutline } from '@mdi/js';

const Container = styled.div({
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const Text = styled.div({
  marginLeft: 10,
  fontFamily: fonts.andaleMono,
  fontSize: 28,
});

export default function Loading() {
  return (
    <Container>
      <Icon size="36px" path={mdiHexagonOutline} spin />
      <Text>Loading...</Text>
    </Container>
  );
}
