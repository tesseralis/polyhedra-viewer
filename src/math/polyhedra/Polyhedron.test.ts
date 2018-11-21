import Polyhedron from './Polyhedron';
import { SolidData } from './solidTypes';

describe('Polyhedron', () => {
  const solidData: SolidData = {
    vertices: [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]],
    faces: [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]],
    name: 'tetrahedron',
  };
  const polyhedron = new Polyhedron(solidData);

  describe('edges', () => {
    it('populates on load if not provided', () => {
      expect(polyhedron.edges).toHaveLength(6);
    });
  });

  describe('vertexConfiguration', () => {
    it('gets all the correct vertex configurations', () => {
      expect(Polyhedron.get('icosidodecahedron').vertexConfiguration()).toEqual(
        {
          '3.5.3.5': 30,
        },
      );
      expect(
        Polyhedron.get('triangular-hebesphenorotunda').vertexConfiguration(),
      ).toEqual({
        '3.3.3.5': 3,
        '3.4.3.5': 6,
        '3.5.3.5': 3,
        '3.3.4.6': 6,
      });
    });
  });

  describe('volume, surface area, sphericity', () => {
    const cube = Polyhedron.get('cube');
    it('correctly calculates volume', () => {
      expect(cube.normalizedVolume()).toBeCloseTo(1, 3);
    });

    it('correctly calculates surface area', () => {
      expect(cube.normalizedSurfaceArea()).toBeCloseTo(6, 3);
    });
    it('correctly calculates surface area', () => {
      expect(cube.sphericity()).toBeCloseTo(0.806, 3);
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
