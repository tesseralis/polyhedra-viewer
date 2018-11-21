import React, { ComponentType } from 'react';
import InfoPanel from './InfoPanel';
import ConfigForm from './ConfigForm';
import PolyhedronList from './PolyhedronList';

interface Props {
  panel: string;
  operationsPanel: ComponentType<{}>;
}
export default function Panels({
  panel,
  operationsPanel: OperationsPanel,
}: Props) {
  switch (panel) {
    case 'info':
      return <InfoPanel />;
    case 'operations':
      return <OperationsPanel />;
    case 'options':
      return <ConfigForm />;
    case 'list':
      return <PolyhedronList />;
    case 'full':
      return null;
    default:
      throw new Error('unknown tab');
  }
}
