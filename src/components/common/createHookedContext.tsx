import React, { useMemo, useReducer, useContext } from 'react';
import _ from 'lodash';

type Args = any[];
type Action<S> = (state: S) => S;
type ActionCreator<S> = (...args: Args) => Action<S>;
type ActionCreators<S, A extends string> = Record<A, ActionCreator<S>>;

type Dispatch = (...args: Args) => void;
type Actions<A extends string> = Record<A, Dispatch>;

type PropType = { [prop: string]: any };

/**
 * Given a set of state actions, generate a context provider and useful hooks
 * to access its state and actions.
 *
 * @return an object with keys Provider, useState, useActions.
 */
export default function createHookedContext<S, A extends string>(
  actions: ActionCreators<S, A>,
  defaultStateCreator: S | ((props: PropType) => S),
) {
  const defaultState = _.isFunction(defaultStateCreator)
    ? defaultStateCreator()
    : defaultStateCreator;
  const StateContext = React.createContext<S>(defaultState);

  const ActionContext = React.createContext<Actions<A>>({} as Actions<A>);

  return {
    Provider({ children, ...props }: PropType) {
      const defaultState = _.isFunction(defaultStateCreator)
        ? defaultStateCreator(props)
        : defaultStateCreator;
      const [state, dispatch] = useReducer(
        (state, action: Action<S>) => action(state),
        defaultState,
      );

      const actionsValue = useMemo(() => {
        return _.mapValues(
          actions,
          (action: ActionCreator<S>) => (...args: Args) =>
            dispatch(action(...args)),
        );
      }, []) as Actions<A>;

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
