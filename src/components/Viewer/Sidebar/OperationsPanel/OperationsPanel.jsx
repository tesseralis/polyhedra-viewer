// @flow
import _ from 'lodash';
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { operations } from 'polyhedra/operations';
import { Tooltip } from 'components/common';
import { WithOperation } from 'components/Viewer/OperationContext';
import { WithPolyhedron } from 'components/Viewer/PolyhedronContext';
import OperationIcon from './OperationIcon';

const styles = StyleSheet.create({
  opGrid: {
    padding: '0 10px',
    display: 'grid',
    columnGap: 5,
    rowGap: 30,
    // TODO encode the ordering in the actual operation types
    gridTemplateAreas: `
      "recenter recenter     resize   resize"
      "truncate rectify      cumulate dual"
      "expand   snub         contract twist"
      "elongate gyroelongate shorten  turn"
      "augment  augment      diminish gyrate"
    `,
  },

  operations: {
    padding: '10px 0',
  },

  operationButton: {
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
    border: '2px red solid',
  },

  recenterButton: {
    borderColor: 'LightGray',
    marginTop: 10,
    gridArea: 'recenter',
    padding: 10,
  },

  resizeButton: {
    borderColor: 'LightGray',
    marginTop: 10,
    gridArea: 'resize',
    padding: 10,
  },
});

export interface OperationsPanelProps {
  isTransitioning: boolean;
  operation: string;
  selectOperation(op: string): void;
  isEnabled(op: string): void;
  recenter(): void;
  resize(): void;
}

// TODO this could probably use a test to make sure all the buttons are in the right places
function OperationsPanel({
  isTransitioning,
  operation,
  recenter,
  resize,
  selectOperation,
  isEnabled,
}: OperationsPanelProps) {
  return (
    <div className={css(styles.opGrid)}>
      {operations.map(({ name, symbol, description }) => {
        return (
          <div key={name} style={{ gridArea: name }}>
            <Tooltip
              content={description}
              trigger={false && isEnabled(name) ? ['hover'] : []}
            >
              <button
                className={css(
                  styles.operationButton,
                  operation === name && styles.isHighlighted,
                )}
                disabled={!isEnabled(name) || isTransitioning}
                onClick={() => selectOperation(name)}
              >
                <OperationIcon name={name} />
                {name}
              </button>
            </Tooltip>
          </div>
        );
      })}
      <button
        disabled={isTransitioning}
        onClick={recenter}
        className={css(styles.recenterButton)}
      >
        Recenter
      </button>
      <button
        disabled={isTransitioning}
        onClick={resize}
        className={css(styles.resizeButton)}
      >
        Resize
      </button>
    </div>
  );
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
              'operation',
              'selectOperation',
              'isEnabled',
            ])}
          />
        )}
      </WithOperation>
    )}
  </WithPolyhedron>
);
