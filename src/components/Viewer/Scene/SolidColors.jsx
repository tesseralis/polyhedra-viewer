// @flow
import _ from 'lodash';
import React, { Component } from 'react';
import tinycolor from 'tinycolor2';
import { WithPolyhedron } from 'components/Viewer/PolyhedronContext';
import { WithOperation } from 'components/Viewer/OperationContext';

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb();
  return [r / 255, g / 255, b / 255];
}

class SolidColors extends Component<*> {
  render() {
    return this.props.children(this.getColors());
  }

  getColors = () => {
    const { polyhedron } = this.props;
    return polyhedron.faces.map(this.getColorForFace);
  };

  getColorForFace = (face: *) => {
    const {
      config,
      polyhedron,
      faceColors,
      hitOptions,
      operation,
    } = this.props;
    const { colors } = config;

    // While doing animation, if we specify that this face has a color, use it
    if (!!faceColors && _.has(faceColors, face.index.toString())) {
      return toRgb(faceColors[face.index]);
    }

    if (operation && operation.isHighlighted(polyhedron, hitOptions, face)) {
      return toRgb(
        tinycolor.mix(colors[face.numSides], 'lightyellow').toHexString(),
      );
    }

    return toRgb(colors[face.numSides]);
  };
}

export default (props: *) => {
  return (
    <WithOperation>
      {operationProps => (
        <WithPolyhedron>
          {polyhedronProps => (
            <SolidColors
              {...props}
              {..._.pick(polyhedronProps, 'polyhedron', 'config', 'faceColors')}
              {..._.pick(operationProps, 'operation', 'hitOptions')}
            />
          )}
        </WithPolyhedron>
      )}
    </WithOperation>
  );
};
