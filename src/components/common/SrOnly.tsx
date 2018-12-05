import React from 'react';
import { useStyle } from 'styles';
import { ChildrenProp } from 'types';

export default function SrOnly({ children }: ChildrenProp) {
  const css = useStyle({
    position: 'absolute',
    height: 1,
    width: 1,
    overflow: 'hidden',
    clip: 'rect(1px, 1px, 1px, 1px)',
  });
  return <span {...css()}>{children}</span>;
}
