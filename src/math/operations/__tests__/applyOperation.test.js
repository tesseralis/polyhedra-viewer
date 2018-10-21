import _ from 'lodash';
import { allSolidNames } from 'data';
import { getOperations } from '../operationUtils';
import { operations } from '..';
import { Polyhedron } from 'math/polyhedra';
import { setupOperations } from '../operationTestUtils';

setupOperations();
// map from polyhedron to excluded operations
const excludedOperations = {};

describe('applyOperation', () => {
  const polyhedra = _.map(allSolidNames, name => Polyhedron.get(name));
  _.forEach(operations, (operation, opName) => {
    describe(opName, () => {
      _.forEach(polyhedra, polyhedron => {
        if (operation.canApplyTo(polyhedron)) {
          it(polyhedron.name, () => {
            const optsToTest = operation.allOptionCombos(polyhedron);
            optsToTest.forEach(options => {
              const result = operation.apply(polyhedron, options);
              expect(result).toBeValidPolyhedron();
            });
          });
        }
      });
    });
  });
});
