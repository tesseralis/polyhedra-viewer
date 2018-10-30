// @flow strict
/// $FlowFixMe
import { useContext } from 'react';
import tinycolor from 'tinycolor2';
import Config from 'components/ConfigModel';
import {
  PolyhedronContext,
  OperationModel,
  TransitionModel,
} from '../../context';

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb();
  return [r / 255, g / 255, b / 255];
}

export default function useSolidColors() {
  const { colors } = Config.useState();
  const { polyhedron } = useContext(PolyhedronContext);

  const {
    transitionData,
    isTransitioning,
    faceColors,
  } = TransitionModel.useState();
  const { operation, options } = OperationModel.useState();

  // TODO fun memo stuff
  const getColors = () => {
    if (isTransitioning && !!faceColors) {
      return transitionData.faces.map(
        (face, i) => faceColors[i] || colors[face.length],
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
  return {
    colors: getColors().map(toRgb),
    solidData: isTransitioning ? transitionData : polyhedron.solidData,
  };
}
