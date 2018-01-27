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

function checkGyrate(polyhedron, gyrate) {
  const cupolaIndex = polyhedron.cupolaIndices()[0]
  // TODO okay, I keep repeating this...
  const boundary = getBoundary(
    polyhedron
      .cupolaFaceIndices(cupolaIndex)
      .map(fIndex => polyhedron.faces[fIndex]),
  )
  getDirectedEdges(boundary).forEach(edge => {
    // TODO move this to a function
    const [n1, n2] = polyhedron.faces
      .filter(face => _.difference(edge, face).length === 0)
      .map(numSides)
    if (gyrate === 'ortho') {
      expect(n1 === 3).toBe(n2 === 3)
    } else {
      expect(n1 === 3).not.toBe(n2 === 3)
    }
  })
}

describe('operations', () => {
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
          expect(actual.isIsomorphicTo(elongated)).toBe(true)
        })

        it(`can shorten ${elongType}d ${test}`, () => {
          const actual = operations.shorten(elongated)
          expect(actual.isIsomorphicTo(shortened)).toBe(true)
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
        const augmented = operations.augment(polyhedron, {
          fIndex: _.findIndex(polyhedron.faces, face => numSides(face) === 4),
          with: 'Y4',
        })
        checkProperPolyhedron(augmented)
        const expected = Polyhedron.get(`augmented-${test}`)
        expect(augmented.faceCount()).toEqual(expected.faceCount())
      })
    })

    describe('ortho/gyro', () => {
      it('properly aligns truncated solids', () => {
        const polyhedron = Polyhedron.get('truncated-cube')
        const augmented = operations.augment(polyhedron, {
          fIndex: 8,
        })
        const expected = Polyhedron.get('augmented-truncated-cube')
        expect(augmented.isIsomorphicTo(expected)).toBe(true)
      })

      it('properly aligns cupolae', () => {
        const polyhedron = Polyhedron.get('square-cupola')

        const options = ['ortho', 'gyro']
        options.forEach(gyrate => {
          const augmented = operations.augment(polyhedron, {
            fIndex: _.findIndex(polyhedron.faces, face => numSides(face) === 8),
            gyrate,
          })
          const expected = Polyhedron.get(`square-${gyrate}bicupola`)
          expect(augmented.isIsomorphicTo(expected)).toBe(true)
        })
      })

      it('properly aligns elongated cupolae', () => {
        const polyhedron = Polyhedron.get('elongated-triangular-cupola')

        const options = ['ortho', 'gyro']
        options.forEach(gyrate => {
          const augmented = operations.augment(polyhedron, {
            fIndex: _.findIndex(polyhedron.faces, face => numSides(face) === 6),
            gyrate,
          })
          const expected = Polyhedron.get(
            `elongated-triangular-${gyrate}bicupola`,
          )
          expect(augmented.isIsomorphicTo(expected)).toBe(true)
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
              const augmented = operations.augment(polyhedron, {
                fIndex: 11,
                gyrate,
                using,
              })
              checkProperPolyhedron(augmented)
              const expected = Polyhedron.get(expectedName[i])
              expect(augmented.isIsomorphicTo(expected)).toBe(true)
            })
          })
        })
      })
    })

    it('properly augments gyrobifastigium', () => {
      const polyhedron = Polyhedron.get('triangular-prism')
      const fIndices = [2, 3, 4]
      fIndices.forEach(fIndex => {
        const augmented = operations.augment(polyhedron, {
          fIndex,
          gyrate: 'gyro',
          using: 'U2',
        })
        checkProperPolyhedron(augmented)
        const expected = Polyhedron.get('gyrobifastigium')
        expect(augmented.isIsomorphicTo(expected)).toBe(true)
      })
    })
  })

  describe('diminish', () => {
    it('properly diminishes gyrobifastigium', () => {
      const polyhedron = Polyhedron.get('gyrobifastigium')
      polyhedron.fIndices().forEach(fIndex => {
        const diminished = operations.diminish(polyhedron, {
          vIndices: polyhedron.findPeak(polyhedron.faceCentroid(fIndex)),
        })
        checkProperPolyhedron(diminished)
        const expected = Polyhedron.get('triangular-prism')
        expect(diminished.isIsomorphicTo(expected)).toBe(true)
      })
    })
  })
})
