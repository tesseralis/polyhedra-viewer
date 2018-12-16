import React, { useState, useCallback } from 'react';
import Icon from '@mdi/react';
import { mdiMenuDown } from '@mdi/js';

import { useStyle, fonts, fontSizes } from 'styles';
import { colorFill, flexRow, flexColumn } from 'styles/common';
import { SrOnly } from 'components/common';
import Markdown from './Markdown';

function Toggle({ onClick, title }: any) {
  const css = useStyle({
    ...colorFill('blue'),
    ...flexRow('center', 'center'),

    backgroundColor: 'transparent',
    fontSize: fontSizes.f6,
    border: 'none',
    cursor: 'pointer',
    fontFamily: fonts.times,

    ':hover': {
      textDecoration: 'underline',
    },
  });
  return (
    <button {...css()} onClick={onClick}>
      <span>
        <Icon path={mdiMenuDown} size="20px" />
      </span>
      {'More'}
      <SrOnly>{`about ${title}`}</SrOnly>
    </button>
  );
}

interface Props {
  content: string;
  title: string; // used for a11y
  collapsed: boolean;
}

export default function Description({ title, content, collapsed }: Props) {
  const [isCollapsed, setCollapsed] = useState(collapsed);
  const toggle = useCallback(() => setCollapsed(!isCollapsed), [isCollapsed]);
  const brief = content.split('\n\n')[0];

  const css = useStyle(flexColumn('center'));
  return (
    <div {...css()}>
      <div>
        <Markdown source={isCollapsed ? brief : content} />
      </div>
      {isCollapsed && <Toggle onClick={toggle} title={title} />}
    </div>
  );
}
