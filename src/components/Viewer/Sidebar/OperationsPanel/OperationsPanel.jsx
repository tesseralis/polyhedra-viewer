// @flow
import _ from 'lodash';
import React, { PureComponent } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { operations } from 'polyhedra/operations';
import { WithOperation } from 'components/Viewer/OperationContext';
import { WithPolyhedron } from 'components/Viewer/PolyhedronContext';
import OperationIcon from './OperationIcon';
import { verdana, andaleMono } from 'styles/fonts';

const styles = StyleSheet.create({
  opGrid: {
    padding: 10,
    display: 'grid',
    justifyContent: 'space-around',
    columnGap: 5,
    rowGap: 20,
    // TODO encode the ordering in the actual operation types
    gridTemplateAreas: `
      "truncate rectify      cumulate dual"
      "expand   snub         contract twist"
      "elongate gyroelongate shorten  turn"
      "augment  augment      diminish gyrate"
      "recenter recenter     resize   resize"
    `,
  },

  operations: {
    padding: '10px 0',
  },

  operationButton: {
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
  },

  isHighlighted: {
    border: '2px DarkSlateGray solid',
  },

  resetButton: {
    borderColor: 'LightGray',
    marginTop: 10,
    padding: 10,
    fontSize: 14,
    fontFamily: andaleMono,
  },
});

// TODO this could probably use a test to make sure all the buttons are in the right places
class OperationsPanel extends PureComponent<*> {
  componentWillUnmount() {
    this.props.unsetOperation();
  }

  render() {
    const {
      isTransitioning,
      opName,
      recenter,
      resize,
      selectOperation,
      isEnabled,
    } = this.props;
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
              disabled={!isEnabled(name) || isTransitioning}
              onClick={() => selectOperation(name)}
            >
              <OperationIcon name={name} />
              {name}
            </button>
          );
        })}
        <button
          disabled={isTransitioning}
          onClick={recenter}
          style={{ gridArea: 'recenter' }}
          className={css(styles.resetButton)}
        >
          Recenter
        </button>
        <button
          disabled={isTransitioning}
          onClick={resize}
          style={{ gridArea: 'resize' }}
          className={css(styles.resetButton)}
        >
          Resize
        </button>
      </div>
    );
  }
}

export default (props: *) => (
  <WithPolyhedron>
    {polyhedronProps => (
      <WithOperation>
        {operationProps => (
          <OperationsPanel
            {...props}
            {..._.pick(polyhedronProps, [
              'resize',
              'recenter',
              'isTransitioning',
            ])}
            {..._.pick(operationProps, [
              'opName',
              'selectOperation',
              'unsetOperation',
              'isEnabled',
            ])}
          />
        )}
      </WithOperation>
    )}
  </WithPolyhedron>
);
