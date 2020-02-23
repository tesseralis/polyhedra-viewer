import _ from 'lodash'

import React, { memo } from 'react'

import { useStyle, scales } from 'styles'
import { media, fonts } from 'styles'
import { hover, scroll, square, flexColumn, flexRow } from 'styles/common'
import { operations, OpName } from 'math/operations'
import {
  useApplyOperation,
  OperationCtx,
  TransitionCtx,
  PolyhedronCtx,
} from 'components/Viewer/context'
import OperationIcon from './OperationIcon'

const opLayout: OpName[][] = [
  ['truncate', 'rectify', 'sharpen', 'dual'],
  ['expand', 'snub', 'contract', 'twist'],
  ['elongate', 'gyroelongate', 'shorten', 'turn'],
  ['augment', 'augment', 'diminish', 'gyrate'],
]

const opList = _.flatMap(opLayout, line => _.uniq(line))

interface Props {
  name: OpName
  disabled: boolean
}
const OpButton = memo(function({ name, disabled }: Props) {
  const polyhedron = PolyhedronCtx.useState()
  const { operation: currentOp } = OperationCtx.useState()
  const { setOperation, unsetOperation } = OperationCtx.useActions()
  const applyOperation = useApplyOperation()
  const operation = operations[name]
  const isCurrent = !!currentOp && name === currentOp.name

  const css = useStyle(
    {
      ...flexColumn('center', 'center'),
      ...hover,
      ...square('5rem'),
      border: isCurrent ? '2px DarkSlateGray solid' : '1px LightGray solid',
      fontFamily: fonts.verdana,
      fontSize: scales.font[7],
      color: 'DimGray',
      backgroundColor: 'white',

      ':disabled': { opacity: 0.3 },
      // add spacing since we're displayed in a row
      // TODO can we do this in the parent styling?
      [media.mobile]: {
        ':not(:last-child)': { marginRight: scales.spacing[2] },
      },
    },
    [isCurrent],
  )

  const selectOperation = () => {
    if (isCurrent) {
      return unsetOperation()
    }

    if (!operation.hasOptions(polyhedron)) {
      applyOperation(operation)
    } else {
      setOperation(operation, polyhedron)
    }
  }
  return (
    <button
      {...css()}
      style={{ gridArea: name }}
      onClick={selectOperation}
      disabled={!operation.canApplyTo(polyhedron) || disabled}
    >
      <OperationIcon name={name} />
      {name}
    </button>
  )
})

export default function OpGrid() {
  const { isTransitioning } = TransitionCtx.useState()
  const css = useStyle({
    [media.notMobile]: {
      display: 'grid',
      justifyContent: 'space-between',
      gridColumnGap: scales.spacing[1],
      gridRowGap: scales.spacing[2],
      gridTemplateAreas: opLayout.map(line => `"${line.join(' ')}"`).join('\n'),
    },
    [media.mobile]: {
      ...flexRow(),
      ...scroll('x'),
      width: '100%',
    },
  })
  return (
    <div {...css()}>
      {opList.map(name => (
        <OpButton key={name} name={name} disabled={isTransitioning} />
      ))}
    </div>
  )
}
