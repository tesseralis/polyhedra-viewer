import Polyhedron from './Polyhedron'

describe('Polyhedron', () => {
  const vertices = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]]
  const faces = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]]
  const polyhedron = new Polyhedron(vertices, faces)

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
})
