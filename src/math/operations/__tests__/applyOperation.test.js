import _ from 'lodash';
import { allSolidNames } from 'data';
import { getOperations } from '../operationUtils';
import { operations } from '..';
import { Polyhedron } from 'math/polyhedra';
import { setupOperations } from '../operationTestUtils';

setupOperations();
// map from polyhedron to excluded operations
const excludedOperations = {};

function getOptsToTest(operation, name, polyhedron) {
  const relations = operation.resultsFor(polyhedron);
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
          const result = operation.apply(polyhedron, options);
          expect(result).toBeValidPolyhedron();
        });
      });
    });
  });
});
