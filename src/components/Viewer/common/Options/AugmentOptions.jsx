// @flow strict
import _ from 'lodash';
import React from 'react';
import { makeStyles } from 'styles';

import connect from 'components/connect';
import { WithPolyhedron, WithOperation } from 'components/Viewer/context';
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

const getOptionName = optValue => {
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

interface Props {
  operation: *;
  options: *;
  polyhedron: *;
  setOption(option: string, value: string): void;
}

function AugmentOptions({ operation, options, polyhedron, setOption }: Props) {
  const { gyrate, using } = options;
  const optionArgs = [
    {
      name: 'gyrate',
      values: !!gyrate ? ['ortho', 'gyro'] : [],
      value: gyrate,
      description:
        'Some solids can be augmented so that opposite faces align (ortho) or not (gyro).',
    },
    {
      name: 'using',
      values: operation.getUsingOpts(polyhedron),
      value: using,
      description: 'Some solids have more than one option to augment a face.',
    },
  ];

  return (
    <div className={styles('augmentOptions')}>
      {optionArgs.map(({ name, values, value, description }) => (
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

export default _.flow([
  connect(
    WithPolyhedron,
    ['polyhedron'],
  ),
  connect(
    WithOperation,
    ['operation', 'options', 'setOption'],
  ),
])(AugmentOptions);
