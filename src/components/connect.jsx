// @flow strict
import React from 'react';
import _ from 'lodash';

type PropsMap = string[] | {};

function mapProps(props, propsMap) {
  if (Array.isArray(propsMap)) {
    return _.pick(props, propsMap);
  }
  return _.mapValues(propsMap, orig => props[orig]);
}

export default (context: *, propsMap: PropsMap) => (wrapped: *) => {
  const Context = context;
  const Wrapped = wrapped;
  return (props: *) => (
    <Context>
      {contextProps => (
        <Wrapped {...props} {...mapProps(contextProps, propsMap)} />
      )}
    </Context>
  );
};
