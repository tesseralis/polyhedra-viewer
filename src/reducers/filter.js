import { SET_FILTER_TEXT } from '../constants/ActionTypes'

const initialState = {
  text: ''
}

export default function filter(state = initialState, action) {
  switch(action.type) {
    case SET_FILTER_TEXT:
      return { ...state, text: action.value || '' }
    default:
      return state
  }
}
