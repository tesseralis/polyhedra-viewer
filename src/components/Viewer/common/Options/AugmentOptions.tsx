import React, { ButtonHTMLAttributes } from 'react'
import { useStyle, scales } from 'styles'

import { PolyhedronCtx, OperationCtx } from 'components/Viewer/context'
import OptionIcon from './OptionIcon'
import { verdana } from 'styles/fonts'
import { hover, square, flexRow, flexColumn } from 'styles/common'

const getOptionName = (optValue: string) => {
  switch (optValue) {
    case 'U2':
      return 'fastigium'
    case 'Y4':
      return 'pyramid'
    case 'U5':
      return 'cupola'
    case 'R5':
      return 'rotunda'
    default:
      return optValue
  }
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  optValue: string
  selected: boolean
}

function OptionButton({ optValue, selected, ...htmlProps }: BtnProps) {
  const css = useStyle(
    {
      ...hover,
      ...square(scales.size[3]),
      border: selected ? '2px DarkSlateGray solid' : '1px LightGray solid',
      backgroundColor: 'white',
      fontFamily: verdana,
    },
    [selected],
  )
  return (
    <button {...htmlProps} {...css()}>
      <OptionIcon name={getOptionName(optValue)} />
      {getOptionName(optValue)}
    </button>
  )
}

interface OptionType<T = any> {
  name: string
  description: string
  values: T[]
  value: T
}

export default function AugmentOptions() {
  const polyhedron = PolyhedronCtx.useState()
  const { operation, options } = OperationCtx.useState()
  const { setOption } = OperationCtx.useActions()

  const { gyrate, using } = options!
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
      values: operation!.allOptions(polyhedron, 'using') ?? [],
      value: using,
      description: 'Some solids have more than one option to augment a face.',
    },
  ]

  const css = useStyle({
    ...flexRow('center', 'space-between'),
    width: '100%',
    height: '100%',
  })

  const optionCss = useStyle({
    ...flexColumn(),
    pointerEvents: 'initial',
  })

  return (
    <div {...css()}>
      {optionArgs.map(({ name, values, value }) => (
        <div key={name} {...optionCss()}>
          {values.map(optValue => (
            <OptionButton
              key={optValue}
              optValue={optValue}
              onClick={() => setOption(name, optValue)}
              disabled={!value}
              selected={value === optValue}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
