import * as _ from 'lodash'
import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'

import { toConwayNotation, fromConwayNotation } from 'constants/polyhedra'
import { applyOperation, setMode, setGyrate } from 'actions'
import { getMode, getGyrateControl } from 'selectors'

import { polyhedraGraph } from 'constants/relations'
import PolyhedronLink from 'components/common/PolyhedronLink'

const operations = {
  d: 'dual',
  t: 'truncation',
  r: 'rectification',
  e: 'cantellation',
  s: 'snub',

  '~t': 'truncation of',
  '~r': 'rectification of',
  '~e': 'cantellation of',
  '~s': 'snub of',

  '+': 'augment',
  '-': 'diminish',
  P: 'elongate',
  A: 'gyroelongate',
  '~P': 'elongation of',
  '~A': 'gyroelongation of',
  g: 'gyrate',
}

const operationOrder = [
  'd',
  't',
  'r',
  'e',
  's',

  '~t',
  '~r',
  '~e',
  '~s',

  '+',
  '-',
  'P',
  'A',
  '~P',
  '~A',
  'g',
]

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  operations: {
    padding: '10px 0',
  },

  title: {
    textAlign: 'center',
  },

  options: {
    display: 'flex',
  },

  modeButton: {
    width: '100%',
    height: 50,
    fontSize: 20,
  },

  optionButton: {
    width: '50%',
    height: 30,
  },

  isHighlighted: {
    border: '2px red solid',
  },
})

function RelatedPolyhedra({
  solid,
  mode,
  gyrateControl,
  applyOperation,
  setMode,
  setGyrate,
}) {
  const notation = toConwayNotation(solid.replace(/-/g, ' '))
  const related = polyhedraGraph[notation]

  return (
    <div className={css(styles.container)}>
      {operationOrder.map(operation => {
        if (
          !related ||
          !related[operation] ||
          !_.compact(related[operation]).length
        )
          return null
        if (_.includes(['g', '-', '+'], operation)) {
          return (
            <div>
              <button
                className={css(
                  styles.modeButton,
                  mode === operation && styles.isHighlighted,
                )}
                onClick={() => setMode(operation, related[operation])}
              >
                {operations[operation]}
              </button>
              {operation === '+' &&
                !!gyrateControl && (
                  <div>
                    <button
                      className={css(
                        styles.optionButton,
                        gyrateControl === 'ortho' && styles.isHighlighted,
                      )}
                      onClick={() => setGyrate('ortho')}
                    >
                      Ortho
                    </button>
                    <button
                      className={css(
                        styles.optionButton,
                        gyrateControl === 'gyro' && styles.isHighlighted,
                      )}
                      onClick={() => setGyrate('gyro')}
                    >
                      Gyro
                    </button>
                  </div>
                )}
            </div>
          )
        }
        return (
          <div key={operation} className={css(styles.operations)}>
            <h2 className={css(styles.title)}>{operations[operation]}</h2>
            <div className={css(styles.options)}>
              {_.compact(related[operation]).map(value => {
                const notation = _.isObject(value) ? value.value : value
                const name = fromConwayNotation(notation)
                // TODO make this a button instead
                return (
                  <PolyhedronLink
                    large
                    key={name}
                    name={name}
                    onClick={() => applyOperation(operation, { name })}
                    subLink="related"
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default connect(
  createStructuredSelector({ mode: getMode, gyrateControl: getGyrateControl }),
  {
    applyOperation,
    setMode,
    setGyrate,
  },
)(RelatedPolyhedra)
