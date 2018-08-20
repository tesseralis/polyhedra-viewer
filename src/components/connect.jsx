// @flow strict
import React from 'react';
import _ from 'lodash';

type PropsMap<T, U> = $Enum<T>[] | { [$Enum<U>]: $Enum<T> } | (T => U);

function mapProps(propsMap, props, ownProps) {
  if (Array.isArray(propsMap)) {
    return _.pick(props, propsMap);
  }
  if (typeof propsMap === 'function') {
    return propsMap({ ...props, ...ownProps });
  }
  return _.mapValues(propsMap, orig => props[orig]);
}

export default (context: *, propsMap: PropsMap<*, *>) => (wrapped: *) => {
  const Context = context;
  const Wrapped = wrapped;
  return (props: *) => (
    <Context>
      {contextProps => (
        <Wrapped {...props} {...mapProps(propsMap, contextProps, props)} />
      )}
    </Context>
  );
};
