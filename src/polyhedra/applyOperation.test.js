import _ from 'lodash';
import { allSolidNames } from 'data';
import { PRECISION, isPlanar } from 'math/linAlg';
import { applyOperation, getOperations, getOpResults } from './operations';
import { Polyhedron, Peak } from 'math/polyhedra';
import { operations } from 'math/operations';
const debug = require('debug')('applyOperation.test');

// map from polyhedron to excluded operations
const excludedOperations = {};

function isProperPolyhedron(polyhedron) {
  const expectedSideLength = polyhedron.edgeLength();
  for (let edge of polyhedron.edges) {
    const sideLength: number = edge.length();
    if (_.isNaN(sideLength)) {
      console.log(`edge ${edge} has length NaN`);
      return false;
    }
    if (Math.abs(sideLength - expectedSideLength) > PRECISION) {
      console.log(
        `edge ${edge} has length ${sideLength} which is different from ${expectedSideLength}`,
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
  const relations = getOpResults(name, operation.name);
  return operation.getAllOptions(polyhedron, relations) || [undefined];
}

// TODO reconsider how these tests are organized
describe('applyOperation', () => {
  allSolidNames.forEach(solidName => {
    it(`correctly applies all possible operations on ${solidName}`, () => {
      const allOperations = getOperations(solidName);
      const excluded = excludedOperations[solidName];
      const opNames = _.difference(allOperations, excluded);
      opNames.forEach(opName => {
        const polyhedron = Polyhedron.get(solidName);
        const operation = operations[opName];
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

  describe('chained tests', () => {
    const tests = [
      {
        description: 'combining twist and turn operations',
        start: 'elongated-pentagonal-bipyramid',
        operations: [
          ['turn', 'icosahedron'],
          ['twist', 'cuboctahedron'],
          ['twist', 'icosahedron'],
          ['turn', 'elongated-pentagonal-bipyramid'],
        ],
      },
      {
        description: 'augmenting and contracting icosahedron',
        start: 'gyroelongated-pentagonal-pyramid',
        operations: [
          { op: 'augment', args: { n: 5 }, expected: 'icosahedron' },
          ['contract', 'tetrahedron'],
        ],
      },
      {
        description: 'dodecahedron -> rectify -> cumulate -> contract',
        start: 'dodecahedron',
        operations: [
          ['rectify', 'icosidodecahedron'],
          { op: 'cumulate', args: { faceType: 5 }, expected: 'icosahedron' },
          ['contract', 'tetrahedron'],
        ],
      },
      {
        description: 'truncation and rectification',
        start: 'tetrahedron',
        operations: [
          ['truncate', 'truncated-tetrahedron'],
          ['cumulate', 'tetrahedron'],
          ['rectify', 'octahedron'],
          ['rectify', 'cuboctahedron'],
          ['truncate', 'truncated-cuboctahedron'],
          ['cumulate', 'cuboctahedron'],
          { op: 'cumulate', args: { faceType: 3 }, expected: 'cube' },
          ['truncate', 'truncated-cube'],
          {
            op: 'augment',
            args: { n: 8 },
            expected: 'augmented-truncated-cube',
          },
        ],
      },
    ];

    function getArgs(args, polyhedron) {
      if (args.n) {
        return { face: polyhedron.faceWithNumSides(args.n) };
      }
      return args;
    }

    function getOpInfo(opInfo, polyhedron) {
      if (Array.isArray(opInfo)) {
        return { op: operations[opInfo[0]], expected: opInfo[1] };
      }
      const { op, args, expected } = opInfo;
      return {
        op: operations[op],
        expected,
        args: getArgs(args, polyhedron),
      };
    }

    tests.forEach(test => {
      const { start, description, operations } = test;
      let polyhedron = Polyhedron.get(start);
      let solidName = start;
      it(description, () => {
        _.forEach(operations, opInfo => {
          const { op, args, expected } = getOpInfo(opInfo, polyhedron);
          const result = applyOperation(op, solidName, polyhedron, args);
          expect(result).toBeValidPolyhedron();
          expect(result.name).toBe(expected);

          polyhedron = result.result;
          solidName = result.name;
        });
      });
    });
  });
});
