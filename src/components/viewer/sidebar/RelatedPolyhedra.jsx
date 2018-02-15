import _ from 'lodash'
import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import Tooltip from 'rc-tooltip'
import 'rc-tooltip/assets/bootstrap.css'

import { toConwayNotation } from 'polyhedra/names'
import { applyOperation, setMode, setApplyOpt } from 'actions'
import { getPolyhedron, getOperation, getApplyOpts } from 'selectors'

import { polyhedraGraph, getUsingOpts } from 'polyhedra/relations'

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

const operations = [
  {
    name: 'truncate',
    symbol: 't',
    description: 'Cut and create a new face at each vertex.',
  },
  {
    name: 'rectify',
    symbol: 'a',
    description: 'Cut (truncate) each vertex at the midpoint of each edge.',
  },
  {
    name: 'cumulate',
    symbol: 'k',
    description: 'Opposite of truncation. Append a pyramid at certain faces.',
  },
  {
    name: 'dual',
    symbol: 'd',
    description: 'Replace each face with a vertex.',
  },
  {
    name: 'expand',
    symbol: 'e',
    description: 'Pull out faces, creating new square faces.',
  },
  {
    name: 'snub',
    symbol: 's',
    description: 'Pull out and twist faces, creating new triangular faces.',
  },
  {
    name: 'contract',
    symbol: 'c',
    description: 'Opposite of expand/snub. Shrink faces in, removing faces.',
  },
  {
    name: 'elongate',
    symbol: 'P',
    description: 'Extend with a prism.',
  },
  {
    name: 'gyroelongate',
    symbol: 'A',
    description: 'Extend with an antiprism.',
  },
  {
    name: 'shorten',
    symbol: 'h',
    description: 'Remove a prism or antiprism',
  },
  {
    name: 'twist',
    symbol: 'p',
    description:
      'Replace each square face with two triangular faces, or vice versa.',
  },
  {
    name: 'augment',
    symbol: '+',
    description: 'Append a pyramid, cupola, or rotunda.',
  },
  {
    name: 'diminish',
    symbol: '-',
    description: 'Remove a pyramid, cupola, or rotunda.',
  },
  {
    name: 'gyrate',
    symbol: 'g',
    description: 'Rotate a cupola or rotunda.',
  },
]

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

function RelatedPolyhedra({
  solid,
  polyhedron,
  mode,
  options,
  applyOperation,
  setMode,
  setApplyOpt,
}) {
  const notation = toConwayNotation(solid)
  const related = polyhedraGraph[notation]
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
    <div className={css(styles.opGrid)}>
      {operations.map(({ name, symbol: operation, description }) => {
        const relations = related[operation]
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
                  placement="bottom"
                  overlay={<div>{description}</div>}
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
              <div>
                {optionArgs.map(
                  ({ name, values, value, description: optDesc }) => (
                    <div key={name} className={css(styles.options)}>
                      <Tooltip
                        placement="bottom"
                        overlay={<div>{optDesc}</div>}
                      >
                        <span>{name}: </span>
                      </Tooltip>
                      {values.map(optValue => (
                        <button
                          key={optValue}
                          onClick={() => setApplyOpt(name, optValue)}
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
                  ),
                )}
              </div>
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
