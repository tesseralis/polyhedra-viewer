// @flow strict
import _ from 'lodash';
import { defaultConfig } from './configOptions';

// $FlowFixMe
import React, { useMemo, useReducer, useContext } from 'react';

function createModel(actions, defaultState) {
  const StateContext = React.createContext(defaultState);
  const ActionContext = React.createContext({});

  return {
    Provider({ children }: *) {
      const [state, dispatch] = useReducer((state, { type, args }) => {
        return actions[type](...args)(state);
      }, defaultState);

      const actionsValue = useMemo(() => {
        return _.mapValues(actions, (_, type) => (...args) =>
          dispatch({ type, args }),
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

export default createModel(
  {
    setValue: (key, value) => state => _.set(_.cloneDeep(state), key, value),
    reset: () => () => defaultConfig,
  },
  defaultConfig,
);
