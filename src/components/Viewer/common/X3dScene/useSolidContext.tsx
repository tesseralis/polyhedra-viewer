import { useMemo } from 'react';
import tinycolor from 'tinycolor2';
import Config from 'components/ConfigCtx';
import { PolyhedronCtx, OperationCtx, TransitionCtx } from '../../context';

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb();
  return [r / 255, g / 255, b / 255];
}

// Hook that takes data from Polyhedron and Animation states and decides which to use.
export default function useSolidContext() {
  const { colors } = Config.useState();
  const polyhedron = PolyhedronCtx.useState();

  const {
    solidData,
    isTransitioning,
    faceColors = [],
  } = TransitionCtx.useState();
  const { operation, options } = OperationCtx.useState();

  // TODO I'm trying to useMemo here so it's similar to reselect?
  // but is that a bad idea?

  // Colors when animation is being applied
  const transitionColors = useMemo(
    () =>
      isTransitioning &&
      solidData!.faces.map((face, i) => faceColors[i] || colors[face.length]),
    [solidData, faceColors, colors],
  );

  // Colors when in operation mode and hit options are being selected
  const operationColors = useMemo(
    () => {
      if (!operation) return;
      const selectState = operation.faceSelectionStates(polyhedron, options!);
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
    },
    [polyhedron, operation, options, colors],
  );

  const normalizedColors = useMemo(
    () => {
      const rawColors =
        transitionColors ||
        operationColors ||
        polyhedron.faces.map(f => colors[f.numSides]);
      return rawColors.map(toRgb);
    },
    [transitionColors, operationColors, polyhedron, colors],
  );

  return {
    colors: normalizedColors,
    solidData: isTransitioning ? solidData! : polyhedron.solidData,
  };
}
