import { memo, useCallback, ButtonHTMLAttributes } from "react"
import { scales } from "styles"
import { get, pick } from "lodash-es"
import { css } from "@emotion/react"

import Config from "components/ConfigCtx"
import {
  configInputs,
  ConfigInput as InputType,
} from "components/configOptions"
import { andaleMono } from "styles/fonts"

function getInputValue<T>(input: InputType<T>, el: HTMLInputElement) {
  switch (input.type) {
    case "checkbox":
      return el.checked
    default:
      return el.value
  }
}

function getInputProps<T>(input: InputType<T>, value: T) {
  switch (input.type) {
    case "checkbox":
      return { checked: value }
    case "range":
      return {
        ...pick(input, ["min", "max", "step"]),
        value,
      }
    default:
      return { value }
  }
}

interface InputProps<T> {
  input: InputType<T>
  value: T
  setValue(key: string, value: T): void
}

function ConfigInput({ input, value, setValue }: InputProps<any>) {
  const inputProps = getInputProps(input, value)
  const onChange = useCallback(
    (e) => setValue(input.key, getInputValue(input, e.target)),
    [input, setValue],
  )
  switch (input.type) {
    case "select":
      return (
        <select onChange={onChange} {...inputProps}>
          {input.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    default:
      return <input type={input.type} onChange={onChange} {...inputProps} />
  }
}

const LabelledInput = memo(({ input, value, setValue }: InputProps<any>) => {
  return (
    <label
      css={css`
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        font-family: ${andaleMono};
        margin-bottom: 1rem;
      `}
    >
      {input.display}
      <ConfigInput input={input} value={value} setValue={setValue} />
    </label>
  )
})

function ResetButton({ onClick }: ButtonHTMLAttributes<Element>) {
  return (
    <button
      type="button"
      onClick={onClick}
      css={css`
        width: 8rem;
        height: 2rem;
        margin-top: ${scales.spacing[3]};

        border: 1px LightGray solid;

        font-family: ${andaleMono};
        font-size: ${scales.font[6]};
        cursor: pointer;
      `}
    >
      Reset
    </button>
  )
}

export default function ConfigForm() {
  const config = Config.useState()
  const { setValue, reset } = Config.useActions()
  return (
    <form
      css={css`
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        width: 100%;
        padding: ${scales.spacing[3]};
      `}
    >
      {configInputs.map((input) => (
        <LabelledInput
          key={input.key}
          input={input}
          value={get(config, input.key)}
          setValue={setValue}
        />
      ))}
      <ResetButton onClick={reset} />
    </form>
  )
}
