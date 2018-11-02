// @flow strict
// $FlowFixMe
import React, { useMemo, useReducer, useContext } from 'react';
import _ from 'lodash';

type ActionCreator<S> = (...args: *) => S => S;
type ActionCreators<S> = { [string]: ActionCreator<S> };

/**
 * Given a set of state actions, generate a context provider and useful hooks.
 * @return an object with keys Provider, useState, useActions.
 */
export default function createHookedContext<S>(
  actions: ActionCreators<S>,
  defaultStateCreator: S | ((...args: *) => S),
) {
  const defaultState =
    typeof defaultStateCreator === 'function'
      ? defaultStateCreator()
      : defaultStateCreator;
  const StateContext = React.createContext(defaultState);
  const ActionContext = React.createContext({});

  return {
    Provider({ children, ...props }: *) {
      const [state, dispatch] = useReducer(
        (state, action) => action(state),
        typeof defaultStateCreator === 'function'
          ? defaultStateCreator(props)
          : defaultState,
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
