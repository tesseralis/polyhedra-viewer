// @flow strict
// $FlowFixMe
import React, { useMemo, useReducer, useContext } from 'react';
import _ from 'lodash';

// TODO type this better?
type ActionCreator<S> = (...args: *) => S => S;
type ActionCreators<S> = { [string]: ActionCreator<S> };

export default function createModel<S>(
  actions: ActionCreators<S>,
  defaultState: S,
) {
  const StateContext = React.createContext(defaultState);
  const ActionContext = React.createContext({});

  return {
    Provider({ children }: *) {
      const [state, dispatch] = useReducer(
        (state, action) => action(state),
        defaultState,
      );

      const actionsValue = useMemo(() => {
        return _.mapValues(actions, action =>
          _.flow(
            action,
            dispatch,
          ),
        );
      }, []);

      return (
        <StateContext.Provider value={state}>
          <ActionContext.Provider value={actionsValue}>
            {children}
          </ActionContext.Provider>
        </StateContext.Provider>
      );
    },
    useState() {
      return useContext(StateContext);
    },
    useActions() {
      return useContext(ActionContext);
    },
  };
}
