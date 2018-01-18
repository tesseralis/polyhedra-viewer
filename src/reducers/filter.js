const SET_FILTER_TEXT = 'SET_FILTER_TEXT'
export const setFilterText = value => ({ type: SET_FILTER_TEXT, value })

const initialState = {
  text: '',
}

export default function filter(state = initialState, action) {
  switch (action.type) {
    case SET_FILTER_TEXT:
      return { ...state, text: action.value || '' }
    default:
      return state
  }
}
