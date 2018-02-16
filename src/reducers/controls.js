const SET_OPERATION = 'SET_OPERATION'
export const setOperation = (operation, relations) => ({
  type: SET_OPERATION,
  operation,
  relations,
})

const SET_APPLY_OPTS = 'SET_APPLY_OPTS'
export const setApplyOpts = options => ({
  type: SET_APPLY_OPTS,
  options,
})

const initialState = {
  operation: null,
  options: {},
}

export default function controls(state = initialState, action) {
  switch (action.type) {
    case SET_OPERATION:
      return { ...state, operation: action.operation }
    case SET_APPLY_OPTS:
      return { ...state, options: action.options }
    default:
      return state
  }
}
