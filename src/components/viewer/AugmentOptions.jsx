// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { getUsingOpts } from 'polyhedra/operations';

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
  },

  optionButton: {
    height: 30,
    width: '100%',
  },

  isHighlighted: {
    border: '2px red solid',
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
  disabled: boolean;
}

export default function AugmentOptions({
  options,
  solid,
  onClickOption,
  disabled,
}: Props) {
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
          {/*
          <Tooltip content={description}>
            <span>{name}: </span>
          </Tooltip>
          */}
          {values.map(optValue => (
            <button
              key={optValue}
              onClick={() => onClickOption(name, optValue)}
              disabled={!value || disabled}
              className={css(
                styles.optionButton,
                optValue === value && styles.isHighlighted,
              )}
            >
              {getOptionName(optValue)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
