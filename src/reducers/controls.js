const SET_MODE = 'SET_MODE'
export const setMode = mode => ({ type: SET_MODE, mode })

const initialState = {
  mode: null,
}

export default function controls(state = initialState, action) {
  switch (action.type) {
    case SET_MODE:
      return { ...state, mode: action.mode }
    default:
      return state
  }
}
