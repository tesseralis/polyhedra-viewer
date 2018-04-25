import Polyhedron from './Polyhedron';

describe('Polyhedron', () => {
  let vertices = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]];
  let faces = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]];
  let polyhedron = Polyhedron.of(vertices, faces);

  describe('edges', () => {
    it('populates on load if not provided', () => {
      expect(polyhedron.edges).toHaveLength(6);
    });
  });

  describe('adjacentFaces', () => {
    it('works on single vertex', () => {
      expect(polyhedron.adjacentFaceIndices(0)).toEqual([0, 1, 2]);
    });
    it('works on multiple vertices', () => {
      expect(polyhedron.adjacentFaceIndices(0, 1)).toEqual([0, 1, 2, 3]);
    });
  });

  describe('isSame', () => {
    const testCases = [
      ['rhombicuboctahedron', 'elongated-square-gyrobicupola'],
      ['metabiaugmented-hexagonal-prism', 'parabiaugmented-hexagonal-prism'],
      [
        'parabigyrate-rhombicosidodecahedron',
        'metabigyrate-rhombicosidodecahedron',
      ],
    ];

    testCases.forEach(([p1, p2]) => {
      it(`differentiates between ${p1} and ${p2}`, () => {
        expect(Polyhedron.get(p1).isSame(Polyhedron.get(p2))).toBe(false);
      });
    });
  });
});
