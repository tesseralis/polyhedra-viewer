import graph from './relationsGraph';

// Tests on the relations graph, mostly focusing on edge cases
describe('relationsGraph', () => {
  describe('archimedean', () => {
    it('has all archimedean operations to the platonic solids', () => {
      const platonic = ['T', 'C', 'O', 'D', 'I'];
      const ops = ['d', 't', 'a', 'e', 's'];
      platonic.forEach(solid => {
        ops.forEach(op => {
          expect(graph).toHaveProperty(`${solid}.${op}`, expect.anything());
        });
      });
    });

    it("doesn't allow augmenting the octahedron", () => {
      expect(graph.O).not.toHaveProperty('+');
    });

    it('has truncate operation on the rectification', () => {
      const rectified = ['O', 'aC', 'aD'];
      rectified.forEach(solid => {
        expect(graph).toHaveProperty(`${solid}.t`, expect.anything());
      });
    });

    it('has twist operator on the expansion', () => {
      const rectified = ['aC', 'eC', 'eD'];
      rectified.forEach(solid => {
        expect(graph).toHaveProperty(`${solid}.p`, expect.anything());
      });
    });
  });

  describe('pyramids and cupolae', () => {
    it('allows rotunda for decagonal anti/prism', () => {
      expect(graph.P10).toHaveProperty(
        '+',
        expect.arrayContaining([
          expect.objectContaining({ using: 'R5', value: 'J21' }),
        ]),
      );
      expect(graph.A10).toHaveProperty(
        '+',
        expect.arrayContaining([
          expect.objectContaining({ using: 'R5', value: 'J25' }),
        ]),
      );
    });
  });
});
