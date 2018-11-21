import React from 'react';
import { makeStyles } from 'styles';

import { PolyhedronCtx, OperationCtx } from 'components/Viewer/context';
import OptionIcon from './OptionIcon';
import { verdana } from 'styles/fonts';
import { hover } from 'styles/common';

const styles = makeStyles({
  augmentOptions: {
    display: 'flex',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  augmentOption: {
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'initial',
  },

  optionButton: {
    ...hover,
    width: 72,
    height: 72,
    border: '1px LightGray solid',
    backgroundColor: 'white',
    fontFamily: verdana,
  },

  isHighlighted: {
    border: '2px DarkSlateGray solid',
  },
});

const getOptionName = (optValue: string) => {
  switch (optValue) {
    case 'U2':
      return 'fastigium';
    case 'Y4':
      return 'pyramid';
    case 'U5':
      return 'cupola';
    case 'R5':
      return 'rotunda';
    default:
      return optValue;
  }
};

interface OptionType<T = any> {
  name: string;
  description: string;
  values: T[];
  value: T;
}

export default function AugmentOptions() {
  const polyhedron = PolyhedronCtx.useState();
  const { operation, options } = OperationCtx.useState();
  const { setOption } = OperationCtx.useActions();

  const { gyrate, using } = options!;
  const optionArgs: OptionType[] = [
    {
      name: 'gyrate',
      values: !!gyrate ? ['ortho', 'gyro'] : [],
      value: gyrate,
      description:
        'Some solids can be augmented so that opposite faces align (ortho) or not (gyro).',
    },
    {
      name: 'using',
      values: operation!.allOptions(polyhedron, 'using') || [],
      value: using,
      description: 'Some solids have more than one option to augment a face.',
    },
  ];

  return (
    <div className={styles('augmentOptions')}>
      {optionArgs.map(({ name, values, value }) => (
        <div key={name} className={styles('augmentOption')}>
          {values.map(optValue => (
            <button
              key={optValue}
              onClick={() => setOption(name, optValue)}
              disabled={!value}
              className={styles(
                'optionButton',
                optValue === value && 'isHighlighted',
              )}
            >
              <OptionIcon name={getOptionName(optValue)} />
              {getOptionName(optValue)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
