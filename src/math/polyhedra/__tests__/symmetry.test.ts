import * as sym from '../symmetry';

describe('symmetry', () => {
  describe('getSymmetryName', () => {
    function expectSymmetryName(solid: string, expected: string) {
      expect(sym.getSymmetryName(sym.getSymmetry(solid))).toEqual(expected);
    }
    it('works on platonic and archimedean solids', () => {
      expectSymmetryName('snub cube', 'chiral octahedral');
      expectSymmetryName('cube', 'full octahedral');
    });

    it('works on prisms and antiprisms', () => {
      expectSymmetryName('hexagonal prism', 'hexagonal prismatic');
      expectSymmetryName('octagonal antiprism', 'octagonal antiprismatic');
    });

    it('works on johnson solids', () => {
      expectSymmetryName('augmented sphenocorona', 'bilateral');
      expectSymmetryName('sphenocorona', 'biradial');
      expectSymmetryName('square pyramid', 'square pyramidal');
      expectSymmetryName('triaugmented dodecahedron', 'triangular pyramidal');
    });
  });

  describe('getOrder', () => {
    function expectOrder(solid: string, expected: number) {
      expect(sym.getOrder(solid)).toEqual(expected);
    }

    it('works on platonic and archimedean solids', () => {
      expectOrder('tetrahedron', 24);
      expectOrder('snub cube', 24);
      expectOrder('rhombicosidodecahedron', 120);
    });

    it('works on prisms and antiprisms', () => {
      expectOrder('hexagonal prism', 24);
      expectOrder('octagonal antiprism', 32);
    });

    it('works on johnson solids', () => {
      expectOrder('augmented sphenocorona', 2);
      expectOrder('sphenocorona', 4);
      expectOrder('square pyramid', 8);
      expectOrder('triaugmented dodecahedron', 6);
    });
  });
});
