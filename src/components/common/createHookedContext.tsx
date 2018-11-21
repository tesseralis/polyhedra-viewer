import React, { useMemo, useReducer, useContext } from 'react';
import _ from 'lodash';

type Action<S> = (state: S) => S;
type ActionCreator<S> = (...args: any) => Action<S>;
// FIXME be able to extract the keys(and params?) of the action creators
type ActionCreators<S> = { [action: string]: ActionCreator<S> };

/**
 * Given a set of state actions, generate a context provider and useful hooks
 * to access its state and actions.
 *
 * @return an object with keys Provider, useState, useActions.
 */
export default function createHookedContext<S>(
  actions: ActionCreators<S>,
  defaultStateCreator: S | ((...args: any) => S),
) {
  const defaultState = _.isFunction(defaultStateCreator)
    ? defaultStateCreator()
    : defaultStateCreator;
  const StateContext = React.createContext(defaultState);

  const ActionContext = React.createContext<{
    [a: string]: (...args: any) => void;
  }>({});

  return {
    Provider({ children, ...props }: any) {
      const [state, dispatch] = useReducer(
        (state, action: Action<S>) => action(state),
        _.isFunction(defaultStateCreator)
          ? defaultStateCreator(props)
          : defaultState,
      );

      const actionsValue = useMemo(() => {
        return _.mapValues(actions, action => (...args: any) =>
          dispatch(action(...args)),
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
