import * as _ from 'lodash'
import React from 'react'
import { Link } from 'react-router-dom'
import {
  escapeName,
  toConwayNotation,
  fromConwayNotation,
} from 'constants/polyhedra'

import periodicTable from 'constants/periodicTable'
import PolyhedronLink from 'components/common/PolyhedronLink'

const basePolyhedraGraph = {
  T: {
    d: 'T',
    t: 'tT',
    r: 'O',
  },
  C: {
    d: 'O',
    t: 'tC',
    r: 'aC',
    e: 'eC',
  },
  O: {
    t: 'tO',
    r: 'aC',
    e: 'eC',
    s: 'I',
  },
  aC: {
    t: 'bC',
    r: 'eC',
    s: 'sC',
  },
  D: {
    d: 'D',
    t: 'tD',
    r: 'aD',
    e: 'eD',
  },
  I: {
    t: 'tI',
    r: 'aD',
    e: 'eD',
  },
  aD: {
    t: 'bD',
    r: 'eD',
    s: 'sD',
  },
}

// Make everything an array
function normalize(graph) {
  return _.mapValues(graph, ops => _.mapValues(ops, _.castArray))
}

const getInverseOperation = operation => {
  switch (operation) {
    // dual
    case 'd':
    case 'g':
      return operation
    // agument / diminish
    case '+':
      return '-'
    case '-':
      return '+'
    // gyro / elongation
    case 'P':
    case 'A':
      return null
    default:
      return `~${operation}`
  }
}

function makeBidirectional(graph) {
  const result = {}
  for (let [source, operations] of Object.entries(graph)) {
    for (let [operation, sinks] of Object.entries(operations)) {
      for (let sink of sinks) {
        if (!result[sink]) {
          result[sink] = {}
        }
        const reverseOp = getInverseOperation(operation)
        if (!result[sink][reverseOp]) {
          result[sink][reverseOp] = []
        }
        result[sink][reverseOp].push(source)
      }
    }
  }
  return _.merge(result, graph)
}

// FIXME figure out a way to do this j
const prisms = periodicTable[1]
const pyramidsCupolae = periodicTable[3]

const invalidNames = ['concave', 'coplanar']
function convertTableNotation(notation) {
  if (_.isArray(notation)) return notation.map(convertTableNotation)
  if (notation[0] === '!') return notation.substring(1)
  if (_.includes(invalidNames, notation)) return null
  return notation
}

function createBaseJohnsonGraph() {
  let graph = {}
  // TODO add in prisms and antiprisms
  for (let row of pyramidsCupolae.data) {
    // TODO cupola-rotunda
    row = row.map(convertTableNotation)
    graph = {
      ...graph,
      [row[0]]: {
        P: row[1],
        A: row[2],
        '+': row[3],
      },
      [row[1]]: {
        '+': row[4],
      },
      [row[2]]: {
        '+': row[5],
      },
    }

    // gyrate relationships
    for (let cell of row) {
      if (_.isArray(cell)) {
        const [c1, c2] = cell
        graph = {
          ...graph,
          [c1]: {
            ...graph[c1],
            g: c2,
          },
        }
      }
    }
  }
  return graph
}

const baseJohnsonGraph = createBaseJohnsonGraph()

console.log(baseJohnsonGraph)

const polyhedraGraph = makeBidirectional(
  normalize(_.merge(basePolyhedraGraph, baseJohnsonGraph)),
)

console.log('polyhedra graph', polyhedraGraph)

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
  'g',
]

export default function RelatedPolyhedra({ match }) {
  const notation = toConwayNotation(match.params.solid.replace(/-/g, ' '))
  console.log('notation', notation)
  const related = polyhedraGraph[notation]
  console.log('related', related)
  return (
    <div>
      {operationOrder.map(operation => {
        if (
          !related ||
          !related[operation] ||
          !_.compact(related[operation]).length
        )
          return <div />
        return (
          <div>
            {operations[operation]}:{' '}
            {_.compact(related[operation]).map(notation => {
              const name = fromConwayNotation(notation)
              return (
                <div>
                  <PolyhedronLink name={name} subLink="related" />
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
