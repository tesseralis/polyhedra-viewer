import Polyhedron from './Polyhedron'

describe('Polyhedron', () => {
  it('populates edges', () => {
    const vertices = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]]
    const faces = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]]
    const polyhedron = new Polyhedron(vertices, faces)
    expect(polyhedron.edges).toHaveLength(6)
  })
})
