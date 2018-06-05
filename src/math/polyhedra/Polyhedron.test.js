// @flow
import Polyhedron from './Polyhedron';

describe('Polyhedron', () => {
  let vertices = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]];
  let faces = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]];
  let polyhedron = new Polyhedron({ vertices, faces });

  describe('edges', () => {
    it('populates on load if not provided', () => {
      expect(polyhedron.edges).toHaveLength(6);
    });
  });

  describe('isUniform', () => {
    it('counts prisms and antiprisms', () => {
      expect(Polyhedron.get('decagonal-prism').isUniform()).toBe(true);
      expect(Polyhedron.get('decagonal-antiprism').isUniform()).toBe(true);
    });

    it("doesn't count the pseudorhombicuboctaheron", () => {
      expect(Polyhedron.get('elongated-square-gyrobicupola').isUniform()).toBe(
        false,
      );
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
