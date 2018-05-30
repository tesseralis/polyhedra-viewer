// @flow strict
import * as React from 'react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';

interface Props {
  trigger?: string[];
  children?: React.ChildrenArray<*>;
  content?: React.Node;
}

// Wrapper/Adapter around React Components Tooltip
export default function({ trigger = ['hover'], children, content }: Props) {
  return (
    <Tooltip placement="left" overlay={<div>{content}</div>} trigger={trigger}>
      {children}
    </Tooltip>
  );
}
