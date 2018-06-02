// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import _ from 'lodash';

import { WithConfig } from 'components/ConfigContext';
import { configInputs } from 'constants/configOptions';
import { hover } from 'styles/common';
import { andaleMono } from 'styles/fonts';

const getInputValue = (input, el) => {
  switch (input.type) {
    case 'checkbox':
      return el.checked;
    default:
      return el.value;
  }
};

const getInputProps = (input, value) => {
  switch (input.type) {
    case 'checkbox':
      return { checked: value };
    case 'range':
      return {
        ..._.pick(input, ['min', 'max', 'step']),
        value,
      };
    default:
      return { value };
  }
};

const ConfigInput = ({ input, value, setValue }) => {
  const inputProps = getInputProps(input, value);
  const onChange = evt => setValue(getInputValue(input, evt.target));
  switch (input.type) {
    case 'select':
      return (
        <select onChange={onChange} {...inputProps}>
          {_.map(input.options, option => (
            <option value={option}>{option}</option>
          ))}
        </select>
      );
    default:
      return <input type={input.type} onChange={onChange} {...inputProps} />;
  }
};

const LabelledInput = ({ input, value, setValue }) => {
  const styles = StyleSheet.create({
    label: {
      width: '100%',
      marginBottom: 16,
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: andaleMono,
    },
  });

  return (
    <label className={css(styles.label)}>
      {input.display}
      <ConfigInput input={input} value={value} setValue={setValue} />
    </label>
  );
};

const ResetButton = ({ reset }) => {
  const styles = StyleSheet.create({
    resetButton: {
      ...hover,

      width: 120,
      height: 30,
      marginTop: 20,

      border: '1px LightGray solid',

      fontFamily: andaleMono,
      fontSize: 14,
    },
  });

  return (
    <button type="button" onClick={reset} className={css(styles.resetButton)}>
      Reset
    </button>
  );
};

function ConfigForm({ config, setValue, reset }) {
  const styles = StyleSheet.create({
    configMenu: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      padding: 20,
    },
  });

  return (
    <form className={css(styles.configMenu)}>
      {configInputs.map(({ key, ...input }) => (
        <LabelledInput
          key={key}
          input={input}
          value={_.get(config, key)}
          setValue={value => setValue(key, value)}
        />
      ))}
      <ResetButton reset={reset} />
    </form>
  );
}

export default () => (
  <WithConfig>
    {({ config, setValue, reset }) => (
      <ConfigForm config={config} setValue={setValue} reset={reset} />
    )}
  </WithConfig>
);
