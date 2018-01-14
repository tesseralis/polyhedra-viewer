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
    default:
      return `~${operation}`
  }
}

function makeBidirectional(graph) {
  const result = {}
  for (let [source, operations] of Object.entries(graph)) {
    for (let [operation, sinks] of Object.entries(operations)) {
      for (let sink of sinks) {
        if (!sink) {
          continue
        }
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

const invalidNames = ['concave', 'coplanar']
function convertTableNotation(notation) {
  if (_.isArray(notation)) return notation.map(convertTableNotation)
  if (notation[0] === '!') return notation.substring(1)
  if (_.includes(invalidNames, notation)) return null
  return notation
}

function convertTable(table) {
  return table.map(row => row.map(convertTableNotation))
}

// FIXME figure out a way to do this without the table (or inverse the relationship)
const prisms = convertTable(periodicTable[1].data)
const pyramidsCupolae = convertTable(periodicTable[3].data)

const getPyramidRow = index => pyramidsCupolae[index > 2 ? index + 1 : index]

const hasCupolaRotunda = index => _.includes([6, 8], index)
const cupolaRotunda = pyramidsCupolae[7]

const getAugmentations = (rowIndex, colIndex) => {
  return _([
    pyramidsCupolae[rowIndex][colIndex],
    hasCupolaRotunda(rowIndex) && cupolaRotunda[colIndex],
  ])
    .flatten()
    .compact()
    .value()
}

function createBaseJohnsonGraph() {
  let graph = {}
  // relation of prisms and antiprisms
  _.forEach(prisms, (row, index) => {
    const [prism, antiprism] = row
    const pyramidRow = getPyramidRow(index)
    graph = {
      ...graph,
      [prism]: {
        ...graph[prism],
        '+': pyramidRow[1],
      },
      [antiprism]: {
        ...graph[antiprism],
        '+': pyramidRow[2],
      },
    }
  })

  _.forEach(pyramidsCupolae, (row, index) => {
    row = row
    graph = {
      ...graph,
      [row[0]]: {
        ...graph[row[0]],
        P: row[1],
        A: row[2],
        '+': getAugmentations(index, 3),
      },
      [row[1]]: {
        ...graph[row[1]],
        '+': getAugmentations(index, 4),
      },
      [row[2]]: {
        ...graph[row[2]],
        '+': getAugmentations(index, 5),
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
  })

  return graph
}

const baseJohnsonGraph = createBaseJohnsonGraph()

console.log(baseJohnsonGraph)

const baseGraph = normalize(_.merge(basePolyhedraGraph, baseJohnsonGraph))
console.log('baseGraph', baseGraph)

const polyhedraGraph = makeBidirectional(baseGraph)

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
