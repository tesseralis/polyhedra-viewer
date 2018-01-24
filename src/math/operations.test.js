import _ from 'lodash'
import { precision } from './linAlg'
import * as operations from './operations'
import Polyhedron from './Polyhedron'

// Assert that the solid is likely a proper convex regular faced polyhedron.
// Add assertions to this to
function checkProperPolyhedron(polyhedron) {
  // Make sure edges all have the same length
  let prevSideLength
  polyhedron.edges.forEach(edge => {
    const [v1, v2] = edge.map(vIndex => polyhedron.vertexVectors()[vIndex])
    const sideLength = v1.distanceTo(v2)
    if (!_.isNil(prevSideLength)) {
      expect(sideLength).toBeCloseTo(prevSideLength, 3)
    }
    prevSideLength = sideLength
  })
}

describe('operations', () => {
  describe('augment', () => {
    it('properly augments a cupola with itself', () => {
      const polyhedron = Polyhedron.get('triangular-cupola')
      const augmented = operations.augment(polyhedron, {
        fIndex: 7,
        gyrate: 'ortho',
      })
      checkProperPolyhedron(augmented)
    })
  })
})
