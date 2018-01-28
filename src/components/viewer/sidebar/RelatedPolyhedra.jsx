import _ from 'lodash'
import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'

import { toConwayNotation, fromConwayNotation } from 'polyhedra/names'
import { applyOperation, setMode, setApplyOpt } from 'actions'
import { getPolyhedron, getOperation, getApplyOpts } from 'selectors'

import { polyhedraGraph } from 'polyhedra/relations'
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
  '~P': 'shorten',
  '~A': 'shorten',
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
  polyhedron,
  mode,
  options: { gyrate, using },
  applyOperation,
  setMode,
  setApplyOpt,
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
            <div key={operation}>
              <button
                className={css(
                  styles.modeButton,
                  mode === operation && styles.isHighlighted,
                )}
                onClick={() => setMode(solid, operation)}
              >
                {operations[operation]}
              </button>
              {operation === '+' &&
                !!gyrate && (
                  <div>
                    <button
                      className={css(
                        styles.optionButton,
                        gyrate === 'ortho' && styles.isHighlighted,
                      )}
                      onClick={() => setApplyOpt('gyrate', 'ortho')}
                    >
                      Ortho
                    </button>
                    <button
                      className={css(
                        styles.optionButton,
                        gyrate === 'gyro' && styles.isHighlighted,
                      )}
                      onClick={() => setApplyOpt('gyrate', 'gyro')}
                    >
                      Gyro
                    </button>
                  </div>
                )}
              {operation === '+' &&
                !!using && (
                  <div>
                    {_(related[operation])
                      .map('using')
                      .uniq()
                      .map(usingOpt => (
                        <button
                          key={usingOpt}
                          className={css(
                            styles.optionButton,
                            using === usingOpt && styles.isHighlighted,
                          )}
                          onClick={() => setApplyOpt('using', usingOpt)}
                        >
                          {usingOpt}
                        </button>
                      ))
                      .value()}
                  </div>
                )}
            </div>
          )
        }
        return (
          <div key={operation} className={css(styles.operations)}>
            {_.compact(related[operation]).map(value => {
              const nextValue = _.isObject(value) ? value.value : value
              if (!nextValue) return null
              const name = fromConwayNotation(nextValue)
              return (
                <button
                  key={name}
                  className={css(styles.modeButton)}
                  onClick={() => applyOperation(operation, polyhedron)}
                >
                  {operations[operation]}
                </button>
              )
              // // TODO make this a button instead
              // return (
              //   <PolyhedronLink
              //     large
              //     key={name}
              //     name={name}
              //     onClick={() => applyOperation(operation, polyhedron)}
              //     subLink="related"
              //   />
              // )
            })}
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
