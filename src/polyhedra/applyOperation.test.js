import _ from 'lodash';
import { cartesian } from 'util.js';
import { allSolidNames } from 'data';
import { PRECISION } from 'math/linAlg';
import { getOperations, getRelations } from 'polyhedra/relations';
import { Polyhedron, Peak } from 'math/polyhedra';
import { operations, canAugment } from 'math/operations';
import applyOperation from './applyOperation';

const archimedeanOpts = ['t', 'k', 'c', 'r', 'e', 's'];
const johnsonOpts = ['+', '-', 'g', 'P', 'A', 'h'];
const opsToTest = archimedeanOpts.concat(johnsonOpts);

// map from polyhedron to excluded operations
const excludedOperations = {
  cuboctahedron: ['t'],
  icosidodecahedron: ['t'],
  'truncated cuboctahedron': ['k'],
  'truncated icosidodecahedron': ['k'],
};

function isProperPolyhedron(polyhedron) {
  // Make sure edges all have the same length
  let prevSideLength: ?number;
  for (let edge of polyhedron.edges) {
    const [v1, v2] = polyhedron.vertexVectors(edge);
    const sideLength: number = v1.distanceTo(v2);
    if (prevSideLength !== undefined) {
      if (_.isNaN(sideLength)) {
        console.log('nan');
        return false;
      }
      if (Math.abs(sideLength - prevSideLength) > PRECISION) {
        console.log('wonky sides', sideLength, prevSideLength);
        return false;
      }
    }
    prevSideLength = sideLength;
    // Make sure the whole thing is convex
    if (polyhedron.getDihedralAngle(edge) > Math.PI - PRECISION) {
      console.log('concave');
      return false;
    }
  }

  // Make sure all faces are facing the right way
  const centroid = polyhedron.centroid();
  for (let face of polyhedron.getFaces()) {
    const faceCentroid = face.centroid();
    const normal = face.normal();
    const expectedNormal = faceCentroid.sub(centroid);
    if (normal.angleBetween(expectedNormal, true) > Math.PI / 2) {
      console.log('inside out');
      return false;
    }
  }
  return true;
}

expect.extend({
  toBeValidPolyhedron(received) {
    const isProper = isProperPolyhedron(received);
    const matchesName = received.isSame(Polyhedron.get(received.name));
    return {
      message: () => {
        if (!isProper)
          return `expected ${
            this.isNot ? 'an improper' : 'a proper'
          } CRF polyhedron`;
        return `expected polyhedron to ${this.isNot ? 'not be' : 'be'} a ${
          received.name
        }`;
      },
      pass: isProper && matchesName,
    };
  },
});

function getOptsToTest(operation, polyhedron) {
  const relations = getRelations(polyhedron.name, operation);
  return (
    _.invoke(
      operations[operation],
      'getAllApplyArgs',
      polyhedron,
      relations,
    ) || [undefined]
  );
}

describe('applyOperation', () => {
  allSolidNames.forEach(solidName => {
    it(`correctly applies all possible operations on ${solidName}`, () => {
      const allOperations = _.intersection(getOperations(solidName), opsToTest);
      const excluded = excludedOperations[solidName];
      const operations = _.difference(allOperations, excluded);
      operations.forEach(operation => {
        const polyhedron = Polyhedron.get(solidName);
        const optsToTest = getOptsToTest(operation, polyhedron);
        optsToTest.forEach(options => {
          const { result } = applyOperation(operation, polyhedron, options);
          expect(result).toBeValidPolyhedron();
        });
      });
    });
  });
});
