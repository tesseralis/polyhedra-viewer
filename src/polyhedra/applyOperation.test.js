import _ from 'lodash';
import { allSolidNames } from 'data';
import { PRECISION, isPlanar } from 'math/linAlg';
import { getOperations, getRelations } from 'polyhedra/operations';
import { Polyhedron, Peak } from 'math/polyhedra';
import { operations, canAugment } from 'math/operations';
import applyOperation from './applyOperation';
const debug = require('debug')('applyOperation.test');

// map from polyhedron to excluded operations
const excludedOperations = {};

function isProperPolyhedron(polyhedron) {
  let prevSideLength: ?number;
  const expectedSideLength = polyhedron.edgeLength();
  for (let edge of polyhedron.edges) {
    const sideLength: number = edge.length();
    if (_.isNaN(sideLength)) {
      console.log(`edge ${edge} has length NaN`);
      return false;
    }
    if (Math.abs(sideLength - expectedSideLength) > PRECISION) {
      console.log(
        `edge ${edge} has length ${sideLength} which is different from ${prevSideLength}`,
      );
      return false;
    }
    // Make sure the whole thing is convex
    if (edge.dihedralAngle() > Math.PI - PRECISION) {
      console.log(`polyhedron concave at edge ${edge}`);
      return false;
    }
  }

  // Make sure all faces are facing the right way
  const centroid = polyhedron.centroid();
  for (let face of polyhedron.faces) {
    const faceCentroid = face.centroid();
    const normal = face.normal();
    const expectedNormal = faceCentroid.sub(centroid);
    if (normal.angleBetween(expectedNormal, true) > Math.PI / 2) {
      console.log(`polyhedron inside out at ${face.index}`);
      return false;
    }
  }
  return true;
}

expect.extend({
  toBeValidPolyhedron(received) {
    const { result, name } = received;
    const isProper = isProperPolyhedron(result);
    const matchesName = result.isSame(Polyhedron.get(name));
    return {
      message: () => {
        if (!isProper)
          return `expected ${
            this.isNot ? 'an improper' : 'a proper'
          } CRF polyhedron`;
        return `expected polyhedron to ${
          this.isNot ? 'not be' : 'be'
        } a ${name}`;
      },
      pass: isProper && matchesName,
    };
  },
});

function getOptsToTest(operation, name, polyhedron) {
  const relations = getRelations(name, operation);
  return (
    operations[operation].getAllApplyArgs(polyhedron, relations) || [undefined]
  );
}

describe('applyOperation', () => {
  allSolidNames.forEach(solidName => {
    it(`correctly applies all possible operations on ${solidName}`, () => {
      const allOperations = getOperations(solidName);
      const excluded = excludedOperations[solidName];
      const operations = _.difference(allOperations, excluded);
      operations.forEach(operation => {
        const polyhedron = Polyhedron.get(solidName);
        const optsToTest = getOptsToTest(operation, solidName, polyhedron);
        optsToTest.forEach(options => {
          const result = applyOperation(
            operation,
            solidName,
            polyhedron,
            options,
          );
          expect(result).toBeValidPolyhedron();
        });
      });
    });
  });
});
