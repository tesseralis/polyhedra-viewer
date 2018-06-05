// @flow
import _ from 'lodash';
import { Component } from 'react';
import tinycolor from 'tinycolor2';
import connect from 'components/connect';
import { WithPolyhedron } from 'components/Viewer/PolyhedronContext';
import { WithOperation } from 'components/Viewer/OperationContext';

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb();
  return [r / 255, g / 255, b / 255];
}

class SolidColors extends Component<*> {
  render() {
    return this.props.children(this.getColors().map(toRgb));
  }

  getColors = () => {
    const {
      faceColors,
      polyhedron,
      operation,
      config: { colors },
      options,
      hitOptions,
    } = this.props;
    if (!_.isEmpty(faceColors)) {
      return polyhedron.faces.map(
        (face, i) => faceColors[i] || colors[face.numSides],
      );
    }
    if (!operation) return polyhedron.faces.map(f => colors[f.numSides]);
    // TODO I want a better way to do this...
    const allOptions = { ...options, ...hitOptions };
    const selectState = operation.getSelectState(polyhedron, allOptions);
    return polyhedron.faces.map((face, i) => {
      switch (selectState[i]) {
        case 'selected':
          return tinycolor.mix(colors[face.numSides], 'lime');
        case 'selectable':
          return tinycolor.mix(colors[face.numSides], 'yellow', 25);
        default:
          return colors[face.numSides];
      }
    });
  };
}

export default _.flow([
  connect(
    WithOperation,
    ['operation', 'options', 'hitOptions'],
  ),
  connect(
    WithPolyhedron,
    ['polyhedron', 'config', 'faceColors'],
  ),
])(SolidColors);
