import _ from 'lodash';
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { operations, getRelations } from 'polyhedra/operations';
import Tooltip from './Tooltip';
import Icon from './Icon';

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
    width: 75,
    height: 75,
    border: '1px LightGray solid',
    color: 'DimGray',

    ':disabled': {
      borderColor: 'LightGray',
      backgroundColor: 'WhiteSmoke',
      color: 'LightGray',
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

const hasMode = [
  'snub',
  'contract',
  'shorten',
  'cumulate',
  'augment',
  'diminish',
  'gyrate',
];

// TODO possibly move this as part of the operation definition
function hasOptions(operation, relations) {
  switch (operation) {
    case 'cumulate':
    case 'contract':
    case 'shorten':
      if (relations.length > 1) {
        return true;
      }
      return false;
    default:
      return _.includes(hasMode, operation);
  }
}

// TODO this could probably use a test to make sure all the buttons are in the right places
export default function OperationsPanel({
  disabled,
  solid,
  operation,
  applyOperation,
  recenter,
  resize,
  setOperation,
}) {
  return (
    <div className={css(styles.opGrid)}>
      {operations.map(({ name, symbol, description }) => {
        const relations = getRelations(solid, name);
        return (
          <div key={name} style={{ gridArea: name }}>
            <Tooltip
              content={description}
              trigger={false && !!relations ? ['hover'] : []}
            >
              <button
                className={css(
                  styles.operationButton,
                  operation === name && styles.isHighlighted,
                )}
                disabled={!relations || disabled}
                onClick={() => {
                  if (hasOptions(name, relations)) {
                    setOperation(name);
                  } else {
                    applyOperation(name);
                  }
                }}
              >
                <Icon name="cube-outline" size={48} />
                {name}
              </button>
            </Tooltip>
          </div>
        );
      })}
      <button
        disabled={disabled}
        onClick={recenter}
        className={css(styles.recenterButton)}
      >
        Recenter
      </button>
      <button
        disabled={disabled}
        onClick={resize}
        className={css(styles.resizeButton)}
      >
        Resize
      </button>
    </div>
  );
}
