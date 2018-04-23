import _ from 'lodash'
import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

import { operations, getRelations, getUsingOpts } from 'polyhedra/relations'
import Tooltip from './Tooltip'

const styles = StyleSheet.create({
  opGrid: {
    padding: '0 10px',
    display: 'grid',
    gridGap: 10,
    gridTemplateAreas: `
      "truncate rectify      dual"
      "cumulate cumulate     dual"
      "expand   snub         twist"
      "contract contract     twist"
      "elongate gyroelongate twist"
      "shorten  shorten      twist"
      "augment  augment      gyrate"
      "diminish diminish     gyrate"
      "recenter recenter     recenter"
    `,
  },

  operations: {
    padding: '10px 0',
  },

  options: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    minHeight: 40,
  },

  modeButton: {
    fontSize: 14,
    width: '100%',
    height: '100%',
    minHeight: 40,
    maxHeight: 60,
    padding: '10px 0',
    border: '1px gray solid',

    ':disabled': {
      borderColor: 'LightGray',
      backgroundColor: 'WhiteSmoke',
    },
  },

  optionButton: {
    height: 30,
    width: '100%',
  },

  isHighlighted: {
    border: '2px red solid',
  },

  recenterButton: {
    borderColor: 'Gray',
    marginTop: 10,
    gridArea: 'recenter',
    padding: 10,
  },
})

const hasMode = ['+', '-', 'g']

const getOptionName = optValue => {
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

function AugmentOptions({ options, solid, onClickOption, disabled }) {
  const { gyrate, using } = options

  const optionArgs = [
    {
      name: 'gyrate',
      values: ['ortho', 'gyro'],
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
  ]

  return (
    <div>
      {optionArgs.map(({ name, values, value, description }) => (
        <div key={name} className={css(styles.options)}>
          <Tooltip content={description}>
            <span>{name}: </span>
          </Tooltip>
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
  )
}

// TODO this could probably use a test to make sure all the buttons are in the right places
export default function RelatedPolyhedra({
  disabled,
  solid,
  operation,
  applyOptions,
  applyOperation,
  recenter,
  setOperation,
  setApplyOpt,
}) {
  return (
    <div className={css(styles.opGrid)}>
      {operations.map(({ name, symbol, description }) => {
        const relations = getRelations(solid, symbol)
        const buttons =
          !relations || _.includes(hasMode, symbol)
            ? [{ value: '' }]
            : relations
        const showResult = buttons.length > 1
        return (
          <div key={name} style={{ gridArea: name }}>
            <div className={css(styles.options)}>
              {buttons.map(relation => (
                <Tooltip
                  key={relation.value}
                  content={description}
                  trigger={!!relations ? ['hover'] : []}
                >
                  <button
                    className={css(
                      styles.modeButton,
                      operation === symbol && styles.isHighlighted,
                    )}
                    disabled={!relations || disabled}
                    onClick={() => {
                      if (_.includes(hasMode, symbol)) {
                        setOperation(symbol !== operation ? symbol : null)
                      } else {
                        applyOperation(symbol, relation)
                      }
                    }}
                  >
                    {name}
                    {showResult ? `: ${relation.value}` : ''}
                  </button>
                </Tooltip>
              ))}
            </div>
            {symbol === '+' && (
              <AugmentOptions
                solid={solid}
                options={applyOptions}
                onClickOption={setApplyOpt}
                disabled={disabled}
              />
            )}
          </div>
        )
      })}
      <button
        disabled={disabled}
        onClick={recenter}
        className={css(styles.recenterButton)}
      >
        Recenter
      </button>
    </div>
  )
}
