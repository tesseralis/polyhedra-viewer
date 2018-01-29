import _ from 'lodash'
import { allSolidNames } from 'data'
import { PRECISION } from 'math/linAlg'
import { getOperations } from 'polyhedra/relations'
import Polyhedron from 'math/polyhedron'
import applyOperation from './applyOperation'

const opsToTest = ['+', '-', 'g', 'P', 'A']

// FIXME deduplicate
function isProperPolyhedron(polyhedron) {
  // Make sure edges all have the same length
  let prevSideLength
  polyhedron.edges.forEach(edge => {
    const [v1, v2] = edge.map(vIndex => polyhedron.vertexVectors()[vIndex])
    const sideLength = v1.distanceTo(v2)
    if (!_.isNil(prevSideLength)) {
      // expect(sideLength).toBeCloseTo(prevSideLength, PRECISION_DIGITS)
      if (Math.abs(sideLength, prevSideLength) > PRECISION) {
        return false
      }
    }
    prevSideLength = sideLength
    // Make sure the whole thing is convex
    if (polyhedron.getDihedralAngle(edge) > Math.PI - PRECISION) {
      return false
    }
  })
  return true
}

expect.extend({
  toBeValidPolyhedron(received) {
    const isProper = isProperPolyhedron(received)
    const matchesName = received.isSame(Polyhedron.get(received.name))
    // TODO check the polyhedron is valid
    return {
      message: () => {
        if (!isProper)
          return `expected ${this.isNot
            ? 'an improper'
            : 'a proper'} CRF polyhedron`
        return `expected polyhedron to ${this.isNot
          ? 'not be'
          : 'be'} a ${received.name}`
      },
      pass: isProper && matchesName,
    }
  },
})

describe('applyOperation', () => {
  allSolidNames.forEach(solidName => {
    it(`correctly applies all possible operations on ${solidName}`, () => {
      const operations = _.intersection(getOperations(solidName), opsToTest)
      operations.forEach(operation => {
        const polyhedron = Polyhedron.get(solidName)
        if (!_.includes(['+', '-', 'g'], operation)) {
          const result = applyOperation(operation, polyhedron)
          expect(result).toBeValidPolyhedron()
        } else if (_.includes(['-', 'g'], operation)) {
          const argsToTest = polyhedron
            .fIndices()
            .map(fIndex => {
              const point = polyhedron.faceCentroid(fIndex)
              return polyhedron.findPeak(point)
            })
            .filter(_.identity)
          argsToTest.forEach(args => {
            const result = applyOperation(operation, polyhedron, args)
            expect(result).toBeValidPolyhedron()
          })
        }
        // for each user defined option and for each applicable face or vertex,
        // do the operation
        // check that the new name matches the new solid
      })
    })
  })
})
