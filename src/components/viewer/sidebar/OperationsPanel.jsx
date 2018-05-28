import _ from 'lodash';
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { operations, getRelations } from 'polyhedra/operations';
import Tooltip from './Tooltip';

const styles = StyleSheet.create({
  opGrid: {
    padding: '0 10px',
    display: 'grid',
    gridGap: 10,
    gridTemplateAreas: `
      "truncate rectify      dual"
      "cumulate cumulate     dual"
      "expand   snub         twist"
      "contract contract     twist"
      "elongate gyroelongate turn"
      "shorten  shorten      turn"
      "augment  augment      gyrate"
      "diminish diminish     gyrate"
      "recenter resize       x"
    `,
  },

  operations: {
    padding: '10px 0',
  },

  options: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    minHeight: 40,
  },

  modeButton: {
    fontSize: 14,
    width: '100%',
    height: '100%',
    minHeight: 40,
    maxHeight: 60,
    padding: '10px 0',
    border: '1px gray solid',

    ':disabled': {
      borderColor: 'LightGray',
      backgroundColor: 'WhiteSmoke',
    },
  },

  optionButton: {
    height: 30,
    width: '100%',
  },

  isHighlighted: {
    border: '2px red solid',
  },

  recenterButton: {
    borderColor: 'Gray',
    marginTop: 10,
    gridArea: 'recenter',
    padding: 10,
  },

  resizeButton: {
    borderColor: 'Gray',
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
            <div className={css(styles.options)}>
              <Tooltip
                content={description}
                trigger={!!relations ? ['hover'] : []}
              >
                <button
                  className={css(
                    styles.modeButton,
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
                  {name}
                </button>
              </Tooltip>
            </div>
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
