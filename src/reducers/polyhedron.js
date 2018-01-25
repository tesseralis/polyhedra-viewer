import Polyhedron from 'math/Polyhedron'

const SET_POLYHEDRON = 'SET_POLYHEDRON'
export const setPolyhedron = (name, data) => ({
  type: SET_POLYHEDRON,
  name,
  data,
})

const initialState = {
  name: 'tetrahedron',
  data: Polyhedron.get('tetrahedron'),
}

export default function polyhedron(state = initialState, action) {
  switch (action.type) {
    case SET_POLYHEDRON:
      return { ...state, data: action.data, name: action.name }
    default:
      return state
  }
}
