import React, { useState } from 'react';
import Icon from '@mdi/react';
import { mdiMenuDown } from '@mdi/js';

import { useStyle, fonts, scales } from 'styles';
import { flexRow, flexColumn, link } from 'styles/common';
import { SrOnly } from 'components/common';
import Markdown from './Markdown';

interface ToggleProps {
  onClick(): void;
  title: string;
}
function Toggle({ onClick, title }: ToggleProps) {
  const css = useStyle({
    ...link,
    ...flexRow('center', 'center'),

    backgroundColor: 'transparent',
    fontSize: scales.font[6],
    border: 'none',
    cursor: 'pointer',
    fontFamily: fonts.times,
  });
  return (
    <button {...css()} onClick={onClick}>
      <span>
        <Icon path={mdiMenuDown} size={scales.size[1]} />
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
  const toggle = () => setCollapsed(collapsed => !collapsed);
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
