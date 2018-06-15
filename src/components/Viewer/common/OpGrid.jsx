// @flow strict
import _ from 'lodash';
import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { media, fonts } from 'styles';
import { hover, scroll } from 'styles/common';
import { getOpResults, operations } from 'polyhedra/operations';
import connect from 'components/connect';
import {
  ApplyOperation,
  WithOperation,
  WithPolyhedron,
} from 'components/Viewer/context';
import OperationIcon from './OperationIcon';

const styles = StyleSheet.create({
  opGrid: {
    [media.notMobile]: {
      display: 'grid',
      justifyContent: 'space-around',
      gridColumnGap: 5,
      gridRowGap: 20,
      // TODO encode the ordering in the actual operation types
      gridTemplateRows: 'repeat(4, 80px)',
      gridTemplateAreas: `
      "truncate rectify      cumulate dual"
      "expand   snub         contract twist"
      "elongate gyroelongate shorten  turn"
      "augment  augment      diminish gyrate"
    `,
    },
    [media.mobile]: {
      ...scroll('x'),
      height: 85,
      display: 'flex',
      width: '100%',
    },
  },

  operationButton: {
    fontFamily: fonts.verdana,
    fontSize: 12,
    width: 84,
    height: 84,
    border: '1px LightGray solid',
    color: 'DimGray',
    backgroundColor: 'white',

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',

    ':disabled': {
      opacity: 0.3,
    },

    ...hover,

    [media.mobile]: {
      margin: '0 8px',
    },
  },

  isHighlighted: {
    border: '2px DarkSlateGray solid',
  },
});

function isEnabled(solid, operation) {
  return !!getOpResults(solid, operation);
}

// TODO this could probably use a test to make sure all the buttons are in the right places
class OpGrid extends Component<*> {
  componentWillUnmount() {
    this.props.unsetOperation();
  }

  render() {
    const { isTransitioning, solidName, opName, selectOperation } = this.props;

    return (
      <div className={css(styles.opGrid)}>
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
])(OpGrid);
