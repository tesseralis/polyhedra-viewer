// @flow strict
import _ from 'lodash';
/// $FlowFixMe
import { useContext } from 'react';
import tinycolor from 'tinycolor2';
import ConfigContext from 'components/ConfigContext';
import { PolyhedronContext, OperationContext } from '../../context';

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb();
  return [r / 255, g / 255, b / 255];
}

// TODO we should be able to just turn this into a hook

export default function useSolidColors() {
  const {
    config: { colors },
  } = useContext(ConfigContext);
  const { polyhedron, faceColors } = useContext(PolyhedronContext);
  const { operation, options } = useContext(OperationContext);

  // TODO fun memo stuff
  const getColors = () => {
    if (!_.isEmpty(faceColors)) {
      return polyhedron.faces.map(
        (face, i) => faceColors[i] || colors[face.numSides],
      );
    }
    if (!operation) return polyhedron.faces.map(f => colors[f.numSides]);
    // TODO I want a better way to do this...
    const selectState = operation.faceSelectionStates(polyhedron, options);
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
  return getColors().map(toRgb);
}
