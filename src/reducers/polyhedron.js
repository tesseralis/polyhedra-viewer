import Polyhedron from 'math/Polyhedron'

const SET_POLYHEDRON = 'SET_POLYHEDRON'
export const setPolyhedron = polyhedron => ({
  type: SET_POLYHEDRON,
  polyhedron,
})

const initialState = Polyhedron.get('tetrahedron')

export default function polyhedron(state = initialState, action) {
  switch (action.type) {
    case SET_POLYHEDRON:
      return action.polyhedron
    default:
      return state
  }
}
