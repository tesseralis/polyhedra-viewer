import _ from 'lodash'
import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'

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

const ops = [
  'truncate',
  'rectify',
  'cumulate',
  'dual',
  'expand',
  'snub',
  'contract',
  'elongate',
  'gyroelongate',
  'shorten',
  'twist',
  'augment',
  'diminish',
  'gyrate',
]

const hasMode = ['+', '-', 'g']

const opSymbols = {
  truncate: 't',
  rectify: 'r',
  cumulate: 'k', // for 'kis'
  dual: 'd',
  expand: 'e',
  snub: 's',
  contract: 'c', // not an official symbol
  twist: 'p', // for "propeller". I *think* this is what this is
  augment: '+',
  diminish: '-',
  elongate: 'P',
  gyroelongate: 'A',
  shorten: 'h', // not an official symbol
  gyrate: 'g',
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

  return (
    <div className={css(styles.opGrid)}>
      {ops.map(op => {
        const operation = opSymbols[op]
        const relations = related[operation]
        const buttons =
          !relations || _.includes(hasMode, operation)
            ? [{ value: '' }]
            : relations
        const showResult = buttons.length > 1
        return (
          <div key={op} style={{ gridArea: op }}>
            <div className={css(styles.options)}>
              {buttons.map(relation => {
                return (
                  <button
                    key={relation.value}
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
                    {op}
                    {showResult ? `: ${relation.value}` : ''}
                  </button>
                )
              })}
            </div>
            {operation === '+' && (
              <div>
                <div className={css(styles.options)}>
                  gyrate:{' '}
                  {['ortho', 'gyro'].map(gyrateOpt => {
                    return (
                      <button
                        key={gyrateOpt}
                        onClick={() => setApplyOpt('gyrate', gyrateOpt)}
                        disabled={!gyrate}
                        className={css(
                          styles.optionButton,
                          gyrateOpt === gyrate && styles.isHighlighted,
                        )}
                      >
                        {gyrateOpt}
                      </button>
                    )
                  })}
                </div>
                <div className={css(styles.options)}>
                  using:{' '}
                  {getUsingOpts(solid).map(usingOpt => {
                    return (
                      <button
                        key={usingOpt}
                        onClick={() => setApplyOpt('using', usingOpt)}
                        disabled={!using}
                        className={css(
                          styles.optionButton,
                          usingOpt === using && styles.isHighlighted,
                        )}
                      >
                        {usingOpt}
                      </button>
                    )
                  })}
                </div>
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
