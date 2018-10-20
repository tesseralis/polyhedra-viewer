// @flow strict
import React from 'react';
import { makeStyles } from 'styles';
import _ from 'lodash';

import { WithConfig } from 'components/ConfigContext';
import { configInputs } from 'components/configOptions';
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
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    default:
      return <input type={input.type} onChange={onChange} {...inputProps} />;
  }
};

const LabelledInput = ({ input, value, setValue }) => {
  const styles = makeStyles({
    label: {
      width: '100%',
      marginBottom: 16,
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: andaleMono,
    },
  });

  return (
    <label className={styles('label')}>
      {input.display}
      <ConfigInput input={input} value={value} setValue={setValue} />
    </label>
  );
};

const ResetButton = ({ reset }) => {
  const styles = makeStyles({
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
    <button type="button" onClick={reset} className={styles('resetButton')}>
      Reset
    </button>
  );
};

export default function ConfigForm() {
  const styles = makeStyles({
    configMenu: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      padding: 20,
    },
  });

  return (
    <WithConfig>
      {({ config, setValue, reset }) => (
        <form className={styles('configMenu')}>
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
      )}
    </WithConfig>
  );
}
