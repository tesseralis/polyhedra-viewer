// @flow strict
import React from 'react';
import { styled } from 'styles';
import _ from 'lodash';

import Config from 'components/ConfigContext';
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

const Label = styled.label({
  width: '100%',
  marginBottom: 16,
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: andaleMono,
});

const LabelledInput = ({ input, value, setValue }) => {
  return (
    <Label>
      {input.display}
      <ConfigInput input={input} value={value} setValue={setValue} />
    </Label>
  );
};

const ResetButton = styled.button.attrs({ type: 'button', children: 'Reset' })({
  ...hover,

  width: 120,
  height: 30,
  marginTop: 20,

  border: '1px LightGray solid',

  fontFamily: andaleMono,
  fontSize: 14,
});

const Form = styled.form({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  padding: 20,
});

export default function ConfigForm() {
  const config = Config.useState();
  const { setValue, reset } = Config.useActions();
  return (
    <Form>
      {configInputs.map(({ key, ...input }) => (
        <LabelledInput
          key={key}
          input={input}
          value={_.get(config, key)}
          setValue={value => setValue(key, value)}
        />
      ))}
      <ResetButton onClick={reset} />
    </Form>
  );
}
