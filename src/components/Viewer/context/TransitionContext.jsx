// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React, { useRef, useState, useEffect, useContext } from 'react';

import Config from 'components/ConfigModel';
import PolyhedronContext from './PolyhedronContext';
import transition from 'transition';
import { Polyhedron } from 'math/polyhedra';
import { PRECISION } from 'math/geom';

function getCoplanarFaces(polyhedron) {
  const found = [];
  const pairs = [];
  _.forEach(polyhedron.faces, f1 => {
    if (f1.inSet(found) || !f1.isValid()) return;

    _.forEach(f1.adjacentFaces(), f2 => {
      if (!f2 || !f2.isValid()) return;
      if (f1.normal().equalsWithTolerance(f2.normal(), PRECISION)) {
        pairs.push([f1, f2]);
        found.push(f1);
        found.push(f2);
        return;
      }
    });
  });
  return pairs;
}

// FIXME colors for dual stopped working
function getFaceColors(polyhedron, colors) {
  const pairs = getCoplanarFaces(polyhedron);
  const mapping = {};
  _.forEach(pairs, ([f1, f2]) => {
    const numSides = f1.numSides + f2.numSides - 2;
    mapping[f1.index] = numSides;
    mapping[f2.index] = numSides;
  });

  return _.map(
    polyhedron.faces,
    face => colors[_.get(mapping, face.index, face.numUniqueSides())],
  );
}

function arrayDefaults(first, second) {
  return _.map(first, (item, i) => (_.isNil(item) ? second[i] : item));
}

const defaultState = {
  transitionData: null,
  faceColors: null,
};

const TransitionContext = React.createContext({
  ...defaultState,
  transitionPolyhedron: _.noop,
});

export default TransitionContext;

export function TransitionProvider({ children }: *) {
  const { polyhedron, setPolyhedron } = useContext(PolyhedronContext);
  const [transitionData, setTransitionData] = useState(null);
  const [faceColors, setFaceColors] = useState(null);
  const transitionId = useRef(null);

  const { colors, animationSpeed, enableAnimation } = Config.useState();

  const resetTransitionData = () => {
    setFaceColors(null);
    setTransitionData(null);
  };

  useEffect(
    () => {
      return () => {
        if (transitionId.current) {
          // TODO godddamit
          cancelAnimationFrame(transitionId.current.current);
        }
      };
    },
    [transitionId.current],
  );

  const transitionPolyhedron = (result: Polyhedron, animationData: *) => {
    if (!enableAnimation || !animationData) {
      setPolyhedron(result);
      setTransitionData(null);
      return;
    }

    const { start, endVertices } = animationData;
    const colorStart = getFaceColors(start, colors);
    const colorEnd = getFaceColors(start.withVertices(endVertices), colors);
    const allColorStart = arrayDefaults(colorStart, colorEnd);

    setTransitionData(start.solidData);
    setFaceColors(allColorStart);

    transitionId.current = transition(
      {
        duration: 1000 / animationSpeed,
        startValue: {
          vertices: start.solidData.vertices,
          faceColors: allColorStart,
        },
        endValue: {
          vertices: endVertices,
          faceColors: arrayDefaults(colorEnd, colorStart),
        },
        onFinish: () => {
          setPolyhedron(result);
          resetTransitionData();
        },
      },
      ({ vertices, faceColors }) => {
        setTransitionData({ ...start.solidData, vertices });
        setFaceColors(faceColors);
      },
    );
  };

  const value = {
    faceColors,
    transitionData: transitionData || polyhedron.solidData,
    isTransitioning: !!transitionData,
    transitionPolyhedron,
    resetTransitionData,
  };
  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  );
}
