import _ from 'lodash';
import graph from '../operationGraph';
import { allSolidNames } from 'data';
import { toConwayNotation } from 'math/polyhedra/names';

// Tests on the operation graph, mostly focusing on edge cases
describe('operationGraph', () => {
  it('has an entry for every polyhedron', () => {
    _.forEach(allSolidNames, name => {
      const symbol = toConwayNotation(name);
      expect(graph).toHaveProperty(symbol);
      expect(graph[symbol]).toBeDefined();
    });
  });

  describe('archimedean', () => {
    it('has all archimedean operations to the platonic solids', () => {
      const platonic = ['T', 'C', 'O', 'D', 'I'];
      const ops = ['dual', 'truncate', 'rectify', 'expand', 'snub'];
      platonic.forEach(solid => {
        ops.forEach(op => {
          expect(graph).toHaveProperty(`${solid}.${op}`, expect.anything());
        });
      });
    });

    it("doesn't allow augmenting the octahedron", () => {
      expect(graph.O).not.toHaveProperty('augment');
    });

    it('has truncate operation on the rectification', () => {
      const rectified = ['O', 'aC', 'aD'];
      rectified.forEach(solid => {
        expect(graph).toHaveProperty(`${solid}.truncate`, expect.anything());
      });
    });

    it('has twist operator on the expansion', () => {
      const rectified = ['aC', 'eC', 'eD'];
      rectified.forEach(solid => {
        expect(graph).toHaveProperty(`${solid}.twist`, expect.anything());
      });
    });
  });

  describe('pyramids and cupolae', () => {
    it('allows rotunda for decagonal anti/prism', () => {
      expect(graph.P10).toHaveProperty(
        'augment',
        expect.arrayContaining([
          expect.objectContaining({ using: 'R5', value: 'J21' }),
        ]),
      );
      expect(graph.A10).toHaveProperty(
        'augment',
        expect.arrayContaining([
          expect.objectContaining({ using: 'R5', value: 'J25' }),
        ]),
      );
    });
  });
});
