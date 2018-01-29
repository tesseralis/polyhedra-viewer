import _ from 'lodash'
import { getCentroid, PRECISION, PRECISION_DIGITS } from './linAlg'
import * as operations from './operations'
import Polyhedron, {
  numSides,
  getDirectedEdges,
  getBoundary,
} from './Polyhedron'

// Assert that the solid is likely a proper convex regular faced polyhedron.
// Add assertions to this to
function checkProperPolyhedron(polyhedron) {
  // Make sure edges all have the same length
  let prevSideLength
  polyhedron.edges.forEach(edge => {
    const [v1, v2] = edge.map(vIndex => polyhedron.vertexVectors()[vIndex])
    const sideLength = v1.distanceTo(v2)
    if (!_.isNil(prevSideLength)) {
      expect(sideLength).toBeCloseTo(prevSideLength, PRECISION_DIGITS)
    }
    prevSideLength = sideLength
    // Make sure the whole thing is convex
    expect(polyhedron.getDihedralAngle(edge)).toBeLessThan(Math.PI - PRECISION)
  })
}

xdescribe('operations', () => {
  xdescribe('truncate', () => {
    it('can truncate a tetrahedron', () => {
      const polyhedron = Polyhedron.get('tetrahedron')
      const truncated = operations.truncate(polyhedron)
      const expected = Polyhedron.get('truncated-tetrahedron')

      checkProperPolyhedron(truncated)
      expect(truncated.isSame(expected)).toBe(true)
    })
  })

  const elongTypes = ['elongate', 'gyroelongate']

  elongTypes.forEach(elongType => {
    describe(elongType, () => {
      const tests = [
        'triangular-pyramid',
        'square-pyramid',
        'pentagonal-pyramid',
        'triangular-cupola',
        'square-cupola',
        'pentagonal-cupola',
        'pentagonal-rotunda',
      ]

      tests.forEach(test => {
        // this is planar; skip it
        if (test === 'triangular-pyramid' && elongType === 'gyroelongate')
          return
        const shortened = Polyhedron.get(
          test === 'triangular-pyramid' ? 'tetrahedron' : test,
        )
        const elongated = Polyhedron.get(`${elongType}d-${test}`)
        it(`can elongate ${test}`, () => {
          const actual = operations[elongType](shortened)
          expect(actual.isSame(elongated)).toBe(true)
        })

        it(`can shorten ${elongType}d ${test}`, () => {
          const actual = operations.shorten(elongated)
          expect(actual.isSame(shortened)).toBe(true)
        })
      })
    })
  })
  describe('augment', () => {
    it('can augment prisms', () => {
      const testPolyhedra = [
        'triangular-prism',
        'pentagonal-prism',
        'hexagonal-prism',
      ]
      testPolyhedra.forEach(test => {
        const polyhedron = Polyhedron.get(test)
        const fIndex = _.findIndex(
          polyhedron.faces,
          face => numSides(face) === 4,
        )
        const augmented = operations.augment(polyhedron, fIndex, { with: 'Y4' })
        checkProperPolyhedron(augmented)
        const expected = Polyhedron.get(`augmented-${test}`)
        expect(augmented.faceCount()).toEqual(expected.faceCount())
      })
    })

    describe('ortho/gyro', () => {
      it('properly aligns truncated solids', () => {
        const polyhedron = Polyhedron.get('truncated-cube')
        const fIndex = _.findIndex(
          polyhedron.faces,
          face => numSides(face) === 8,
        )
        const augmented = operations.augment(polyhedron, fIndex)
        const expected = Polyhedron.get('augmented-truncated-cube')
        expect(augmented.isSame(expected)).toBe(true)
      })

      it('properly aligns cupolae', () => {
        const polyhedron = Polyhedron.get('square-cupola')

        const options = ['ortho', 'gyro']
        options.forEach(gyrate => {
          const fIndex = _.findIndex(
            polyhedron.faces,
            face => numSides(face) === 8,
          )
          const augmented = operations.augment(polyhedron, fIndex, {
            gyrate,
          })
          const expected = Polyhedron.get(`square-${gyrate}bicupola`)
          expect(augmented.isSame(expected)).toBe(true)
        })
      })

      it('properly aligns elongated cupolae', () => {
        const polyhedron = Polyhedron.get('elongated-triangular-cupola')

        const options = ['ortho', 'gyro']
        const fIndex = _.findIndex(
          polyhedron.faces,
          face => numSides(face) === 6,
        )
        options.forEach(gyrate => {
          const augmented = operations.augment(polyhedron, fIndex, {
            gyrate,
          })
          const expected = Polyhedron.get(
            `elongated-triangular-${gyrate}bicupola`,
          )
          expect(augmented.isSame(expected)).toBe(true)
        })
      })
    })

    describe('multiple options', () => {
      describe('cupola-rotunda', () => {
        const polyhedron = Polyhedron.get('pentagonal-cupola')
        const usingOpts = ['U5', 'R5']
        const gyrateOpts = ['ortho', 'gyro']

        gyrateOpts.forEach(gyrate => {
          const expectedName = [
            `pentagonal-${gyrate}bicupola`,
            `pentagonal-${gyrate}cupolarotunda`,
          ]
          usingOpts.forEach((using, i) => {
            it(`can augment with ${using}`, () => {
              const fIndex = _.findIndex(
                polyhedron.faces,
                face => numSides(face) === 10,
              )
              const augmented = operations.augment(polyhedron, fIndex, {
                gyrate,
                using,
              })
              checkProperPolyhedron(augmented)
              const expected = Polyhedron.get(expectedName[i])
              expect(augmented.isSame(expected)).toBe(true)
            })
          })
        })
      })
    })

    it('properly augments gyrobifastigium', () => {
      const polyhedron = Polyhedron.get('triangular-prism')
      const fIndices = [2, 3, 4]
      fIndices.forEach(fIndex => {
        const augmented = operations.augment(polyhedron, fIndex, {
          gyrate: 'gyro',
          using: 'U2',
        })
        checkProperPolyhedron(augmented)
        const expected = Polyhedron.get('gyrobifastigium')
        expect(augmented.isSame(expected)).toBe(true)
      })
    })
  })

  describe('diminish', () => {
    it('properly diminishes gyrobifastigium', () => {
      const polyhedron = Polyhedron.get('gyrobifastigium')
      polyhedron.fIndices().forEach(fIndex => {
        const diminished = operations.diminish(
          polyhedron,
          polyhedron.findPeak(polyhedron.faceCentroid(fIndex)),
        )
        checkProperPolyhedron(diminished)
        const expected = Polyhedron.get('triangular-prism')
        expect(diminished.isSame(expected)).toBe(true)
      })
    })
  })

  // TODO make sure this errors when invalid
  describe('getAugmentAlignment', () => {
    const tests = ['hexagonal-prism', 'dodecahedron', 'truncated-dodecahedron']
    const allAlignIndices = [[8, 7], [10, 11], [35, 34]]
    tests.forEach((name, i) => {
      const polyhedron = Polyhedron.get(`augmented-${name}`)
      const alignIndices = allAlignIndices[i]
      const alignTypes = ['para', 'meta']
      alignTypes.forEach((align, j) => {
        const fIndex = alignIndices[j]
        it(`can ${align}augment augmented-${name}`, () => {
          expect(operations.getAugmentAlignment(polyhedron, fIndex)).toEqual(
            align,
          )
        })
      })
    })
  })

  describe('getDiminishAlignment', () => {
    // it('works on diminished icosahedron', () => {
    const polyhedron = Polyhedron.get('gyroelongated-pentagonal-pyramid')
    const alignIndices = [10, 7]
    const alignTypes = ['para', 'meta']
    alignTypes.forEach((align, j) => {
      const vIndex = alignIndices[j]
      it(`can ${align}-diminish a diminished icosahedron`, () => {
        expect(operations.getDiminishAlignment(polyhedron, [vIndex])).toEqual(
          align,
        )
      })
    })
  })
  // })
})
