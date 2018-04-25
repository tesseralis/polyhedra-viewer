import _ from 'lodash';
import { cartesian } from 'util.js';
import { allSolidNames } from 'data';
import { PRECISION } from 'math/linAlg';
import { getOperations, getRelations } from 'polyhedra/relations';
import Polyhedron from 'math/polyhedron';
import Peak from 'math/Peak';
import { canAugment } from 'math/operations';
import applyOperation from './applyOperation';

const archimedeanOpts = ['t', 'k', 'r'];
const johnsonOpts = ['+', '-', 'g', 'P', 'A', '~P', '~A'];
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
    const [v1, v2] = edge.map(vIndex => polyhedron.vertexVectors()[vIndex]);
    const sideLength: number = v1.distanceTo(v2);
    if (prevSideLength !== undefined) {
      if (Math.abs(sideLength - prevSideLength) > PRECISION) {
        return false;
      }
    }
    prevSideLength = sideLength;
    // Make sure the whole thing is convex
    if (polyhedron.getDihedralAngle(edge) > Math.PI - PRECISION) {
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
  switch (operation) {
    case '+':
      const relations = getRelations(polyhedron.name, operation);
      const rawGyrateOpts = _.compact(_.uniq(_.map(relations, 'gyrate')));
      const gyrateOpts =
        rawGyrateOpts.length === 2 ? rawGyrateOpts : [undefined];
      const usingOpts = _.compact(_.uniq(_.map(relations, 'using')));
      const fIndexOpts = polyhedron
        .fIndices()
        .filter(fIndex => canAugment(polyhedron, fIndex));

      // FIXME this leads to invalid combinations
      return cartesian(gyrateOpts, usingOpts, fIndexOpts).map(
        ([gyrate, using, fIndex]) => ({ gyrate, using, fIndex }),
      );
    case '-':
    case 'g':
      return Peak.getAll(polyhedron).map(peak => ({ peak }));
    case 'k':
      if (polyhedron.name === 'cuboctahedron') {
        return [{ polygon: 3 }, { polygon: 4 }];
      } else if (polyhedron.name === 'icosidodecahedron') {
        return [{ polygon: 3 }, { polygon: 5 }];
      }
      return [undefined];
    default:
      return [undefined];
  }
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
