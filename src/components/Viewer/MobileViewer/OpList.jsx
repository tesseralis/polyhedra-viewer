// @flow strict
import _ from 'lodash';
import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { getOpResults, operations } from 'polyhedra/operations';
import connect from 'components/connect';
import {
  ApplyOperation,
  WithOperation,
  WithPolyhedron,
} from 'components/Viewer/context';
import OperationIcon from 'components/Viewer/common/OperationIcon';

import { verdana } from 'styles/fonts';
import { hover } from 'styles/common';

const styles = StyleSheet.create({
  opList: {
    height: 100,
    display: 'flex',
    width: '100%',
    overflowX: 'scroll',
  },

  operationButton: {
    marginRight: 10,
    fontFamily: verdana,
    fontSize: 12,
    width: 84,
    height: 84,
    border: '1px LightGray solid',
    color: 'DimGray',

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',

    ':disabled': {
      opacity: 0.3,
    },

    ...hover,
  },

  isHighlighted: {
    border: '2px DarkSlateGray solid',
  },
});

function isEnabled(solid, operation) {
  return !!getOpResults(solid, operation);
}

// TODO this could probably use a test to make sure all the buttons are in the right places
class OpList extends Component<*> {
  componentWillUnmount() {
    this.props.unsetOperation();
  }

  render() {
    const { isTransitioning, solidName, opName, selectOperation } = this.props;

    return (
      <div className={css(styles.opList)}>
        {operations.map(({ name }) => {
          return (
            <button
              key={name}
              className={css(
                styles.operationButton,
                opName === name && styles.isHighlighted,
              )}
              style={{ gridArea: name }}
              disabled={!isEnabled(solidName, name) || isTransitioning}
              onClick={() => selectOperation(name)}
            >
              <OperationIcon name={name} />
              {name}
            </button>
          );
        })}
      </div>
    );
  }
}

export default _.flow([
  connect(
    WithPolyhedron,
    ['solidName', 'isTransitioning'],
  ),
  connect(
    ApplyOperation,
    ['selectOperation'],
  ),
  connect(
    WithOperation,
    ['opName', 'unsetOperation'],
  ),
])(OpList);
