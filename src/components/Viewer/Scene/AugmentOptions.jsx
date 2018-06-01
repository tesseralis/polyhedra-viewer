// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { getUsingOpts } from 'polyhedra/operations';

import { WithOperation } from 'components/Viewer/OperationContext';
import OptionIcon from './OptionIcon';

const styles = StyleSheet.create({
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
    margin: 20,
  },

  optionButton: {
    width: 64,
    height: 64,
    border: '1px LightGray solid',
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
  options: *;
  solid: string;
  onClickOption(option: string, value: string): void;
}

function AugmentOptions({ options, solid, onClickOption }: Props) {
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
      values: getUsingOpts(solid),
      value: using,
      description: 'Some solids have more than one option to augment a face.',
    },
  ];

  return (
    <div className={css(styles.augmentOptions)}>
      {optionArgs.map(({ name, values, value, description }) => (
        <div key={name} className={css(styles.augmentOption)}>
          {values.map(optValue => (
            <button
              key={optValue}
              onClick={() => onClickOption(name, optValue)}
              disabled={!value}
              className={css(
                styles.optionButton,
                optValue === value && styles.isHighlighted,
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

export default (props: *) => (
  <WithOperation>
    {({ options, setOption }) => (
      <AugmentOptions {...props} options={options} onClickOption={setOption} />
    )}
  </WithOperation>
);
