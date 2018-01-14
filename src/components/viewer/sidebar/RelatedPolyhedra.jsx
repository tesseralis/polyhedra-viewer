import * as _ from 'lodash'
import React from 'react'
import { Link } from 'react-router-dom'
import {
  escapeName,
  toConwayNotation,
  fromConwayNotation,
} from 'constants/polyhedra'
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

function makeBidirectional(graph) {
  const result = {}
  for (let [source, operations] of Object.entries(graph)) {
    for (let [operation, sinks] of Object.entries(operations)) {
      for (let sink of sinks) {
        if (!result[sink]) {
          result[sink] = {}
        }
        const reverseOp = operation === 'd' ? operation : `-${operation}`
        if (!result[sink][reverseOp]) {
          result[sink][reverseOp] = []
        }
        result[sink][reverseOp].push(source)
      }
    }
  }
  return _.merge(result, graph)
}

console.log(normalize(basePolyhedraGraph))

const polyhedraGraph = makeBidirectional(normalize(basePolyhedraGraph))
console.log(polyhedraGraph)

const operations = {
  d: 'dual',
  t: 'truncation',
  r: 'rectification',
  e: 'cantellation',
  s: 'snub',
  '-t': 'truncation of',
  '-r': 'rectification of',
  '-e': 'cantellation of',
  '-s': 'snub of',
}

const operationOrder = ['d', 't', 'r', 'e', 's', '-t', '-r', '-e', '-s']

export default function RelatedPolyhedra({ match }) {
  const notation = toConwayNotation(match.params.solid.replace(/-/g, ' '))
  const related = polyhedraGraph[notation]
  console.log(related)
  return (
    <div>
      {operationOrder.map(operation => {
        if (!related || !related[operation]) return <div />
        return (
          <div>
            {operations[operation]}:{' '}
            {related[operation].map(notation => {
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
