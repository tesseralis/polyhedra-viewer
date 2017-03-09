import * as types from '../constants/ActionTypes'

export const setInputValue = (key, value) => ({
  type: types.SET_INPUT_VALUE, key, value
})
export const reset = () => ({ type: types.RESET })
