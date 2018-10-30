// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React, { useContext } from 'react';

import { flatMap } from 'utils';
import { makeStyles } from 'styles';
import { media, fonts } from 'styles';
import { hover, scroll } from 'styles/common';
import { operations } from 'math/operations';
import {
  useApplyOperation,
  OperationModel,
  TransitionModel,
  PolyhedronContext,
} from 'components/Viewer/context';
import OperationIcon from './OperationIcon';

const opLayout = [
  ['truncate', 'rectify', 'sharpen', 'dual'],
  ['expand', 'snub', 'contract', 'twist'],
  ['elongate', 'gyroelongate', 'shorten', 'turn'],
  ['augment', 'augment', 'diminish', 'gyrate'],
];

const opList = flatMap(opLayout, line => _.uniq(line));

const styles = makeStyles({
  opGrid: {
    [media.notMobile]: {
      display: 'grid',
      justifyContent: 'space-around',
      gridColumnGap: 5,
      gridRowGap: 20,
      gridTemplateRows: 'repeat(4, 80px)',
      gridTemplateAreas: opLayout.map(line => `"${line.join(' ')}"`).join('\n'),
    },
    [media.mobile]: {
      ...scroll('x'),
      height: 85,
      display: 'flex',
      width: '100%',
    },
  },

  operationButton: {
    fontFamily: fonts.verdana,
    fontSize: 12,
    width: 84,
    height: 84,
    border: '1px LightGray solid',
    color: 'DimGray',
    backgroundColor: 'white',

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',

    ':disabled': {
      opacity: 0.3,
    },

    ...hover,

    [media.mobile]: {
      margin: '0 8px',
    },
  },

  isHighlighted: {
    border: '2px DarkSlateGray solid',
  },
});

function OpButton({ name }) {
  const { polyhedron } = useContext(PolyhedronContext);
  const { isTransitioning } = TransitionModel.useState();
  const { operation: currentOp } = OperationModel.useState();
  const { setOperation, unsetOperation } = OperationModel.useActions();
  const applyOperation = useApplyOperation();
  const operation = operations[name];
  const isCurrent = !!currentOp && name === currentOp.name;

  const selectOperation = () => {
    if (isCurrent) {
      return unsetOperation();
    }

    if (!operation.hasOptions(polyhedron)) {
      applyOperation(operation);
    } else {
      setOperation(operation, polyhedron);
    }
  };
  return (
    <button
      className={styles('operationButton', isCurrent && 'isHighlighted')}
      style={{ gridArea: name }}
      onClick={selectOperation}
      disabled={!operation.canApplyTo(polyhedron) || isTransitioning}
    >
      <OperationIcon name={name} />
      {name}
    </button>
  );
}

export default function OpGrid() {
  return (
    <div className={styles('opGrid')}>
      {opList.map(name => (
        <OpButton key={name} name={name} />
      ))}
    </div>
  );
}
