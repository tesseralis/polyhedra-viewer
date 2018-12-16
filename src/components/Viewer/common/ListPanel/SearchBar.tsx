import React, { memo, useState, InputHTMLAttributes } from 'react';
import Icon from '@mdi/react';
import { mdiMagnify } from '@mdi/js';

import { useStyle, fontSizes, spacing } from 'styles';
import { andaleMono } from 'styles/fonts';
import { transition, flexRow } from 'styles/common';

function SearchIcon({ focused }: { focused: boolean }) {
  const css = useStyle(
    {
      ...transition('fill', 0.35),
      position: 'absolute',
      // TODO This is kinda jank but I'm too lazy to fix it for a not useful feature
      paddingLeft: 8,
      paddingTop: 2,
      fill: focused ? 'Gray' : 'LightGray',
    },
    [focused],
  );
  return (
    <span {...css()}>
      <Icon path={mdiMagnify} size="20px" />
    </span>
  );
}

function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const css = useStyle({
    ...transition('border-color', 0.35),
    width: '100%',
    height: 36,
    paddingLeft: spacing.s4,

    border: '2px LightGray solid',
    borderRadius: 28,

    fontSize: fontSizes.f6,
    fontFamily: andaleMono,

    ':focus': {
      outline: 'none',
      borderColor: 'Gray',
      fill: 'Gray',
    },
  });
  return (
    <input
      {...props}
      {...css()}
      type="text"
      placeholder="Search..."
      aria-label="search"
    />
  );
}

interface Props {
  value: string;
  onChange(value: string): void;
}
export default memo(function SearchBar({ value, onChange }: Props) {
  const [isFocused, setFocus] = useState(false);

  const css = useStyle({
    ...flexRow('center'),
    padding: spacing.s2,
    width: '100%',
    position: 'relative',
  });
  return (
    <label {...css()}>
      <SearchInput
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      <SearchIcon focused={isFocused} />
    </label>
  );
});
