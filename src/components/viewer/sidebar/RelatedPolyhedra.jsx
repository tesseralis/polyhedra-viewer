import _ from 'lodash'
import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'

import { applyOperation, setMode, setApplyOpt } from 'actions'
import { getPolyhedron, getOperation, getApplyOpts } from 'selectors'

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
    padding: '10px 0',
  },

  optionButton: {
    height: 30,
    width: '100%',
  },

  isHighlighted: {
    border: '2px red solid',
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

function AugmentOptions({ options, solid, onClickOption }) {
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
              disabled={!value}
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
function RelatedPolyhedra({
  solid,
  polyhedron,
  mode,
  options,
  applyOperation,
  setMode,
  setApplyOpt,
}) {
  return (
    <div className={css(styles.opGrid)}>
      {operations.map(({ name, symbol: operation, description }) => {
        const relations = getRelations(solid, operation)
        const buttons =
          !relations || _.includes(hasMode, operation)
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
                      mode === operation && styles.isHighlighted,
                    )}
                    disabled={!relations}
                    onClick={() => {
                      if (_.includes(hasMode, operation)) {
                        setMode(solid, operation)
                      } else {
                        applyOperation(operation, polyhedron, null, relation)
                      }
                    }}
                  >
                    {name}
                    {showResult ? `: ${relation.value}` : ''}
                  </button>
                </Tooltip>
              ))}
            </div>
            {operation === '+' && (
              <AugmentOptions
                solid={solid}
                options={options}
                onClickOption={setApplyOpt}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default connect(
  createStructuredSelector({
    mode: getOperation,
    polyhedron: getPolyhedron,
    options: getApplyOpts,
  }),
  {
    applyOperation,
    setMode,
    setApplyOpt,
  },
)(RelatedPolyhedra)
