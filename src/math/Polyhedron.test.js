import Polyhedron from './Polyhedron'

describe('Polyhedron', () => {
  let vertices = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]]
  let faces = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]]
  let polyhedron = Polyhedron.of(vertices, faces)

  describe('edges', () => {
    it('populates on load if not provided', () => {
      expect(polyhedron.edges).toHaveLength(6)
    })
  })

  describe('adjacentFaces', () => {
    it('works on single vertex', () => {
      expect(polyhedron.adjacentFaceIndices(0)).toEqual([0, 1, 2])
    })
    it('works on multiple vertices', () => {
      expect(polyhedron.adjacentFaceIndices(0, 1)).toEqual([0, 1, 2, 3])
    })
  })

  describe('isIsomorphicTo', () => {
    const testCases = [
      ['rhombicuboctahedron', 'elongated-square-gyrobicupola'],
      ['metabiaugmented-hexagonal-prism', 'parabiaugmented-hexagonal-prism'],
      [
        'parabigyrate-rhombicosidodecahedron',
        'metabigyrate-rhombicosidodecahedron',
      ],
    ]

    testCases.forEach(([p1, p2]) => {
      it(`differentiates between ${p1} and ${p2}`, () => {
        expect(Polyhedron.get(p1).isIsomorphicTo(Polyhedron.get(p2))).toBe(
          false,
        )
      })
    })
  })

  describe('getPyramidIndices', () => {
    it('chooses only triangular faces that have a planar base', () => {
      const polyhedron = Polyhedron.get('triaugmented-triangular-prism')
      expect(polyhedron.pyramidIndices()).toEqual([1, 4, 7])
    })
  })

  describe('getCupolaIndices', () => {
    it('chooses only cupola faces that have a planar base', () => {
      const polyhedron = Polyhedron.get('elongated-pentagonal-orthobicupola')
      expect(polyhedron.cupolaIndices()).toEqual([30, 31])
    })
  })

  describe('getRotundaIndices', () => {
    it('chooses only rotunda faces', () => {
      const polyhedron = Polyhedron.get('pentagonal-orthobirotunda')
      expect(polyhedron.rotundaIndices()).toEqual([20, 26])
    })
  })
})
