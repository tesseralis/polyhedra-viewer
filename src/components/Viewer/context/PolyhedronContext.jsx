// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React, { useRef, useState, useEffect, useContext } from 'react';

import ConfigContext from 'components/ConfigContext';
import transition from 'transition';
import { Polyhedron } from 'math/polyhedra';
import { PRECISION } from 'math/geom';
import { mapObject } from 'utils';

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
  polyhedron: Polyhedron.get('tetrahedron'),
  faceColors: null,
};

const actions = ['setPolyhedron', 'transitionPolyhedron'];

const PolyhedronContext = React.createContext({
  ...defaultState,
  ...mapObject(actions, action => [action, _.noop]),
});

export default PolyhedronContext;

export function PolyhedronProvider({ disabled, setName, name, children }: *) {
  const [polyhedron, setPolyhedron] = useState(Polyhedron.get(name));
  const [faceColors, setFaceColors] = useState(null);
  const transitionId = useRef(null);

  const { config } = useContext(ConfigContext);

  // If this is disabled, derive the polyhedron from the passed in name
  useEffect(
    () => {
      if (disabled) {
        setFaceColors(null);
        setPolyhedron(Polyhedron.get(name));
      }
    },
    [disabled, name],
  );

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
    const { colors, animationSpeed, enableAnimation } = config;

    if (!enableAnimation || !animationData) {
      setPolyhedron(result);
      return;
    }

    const colorStart = getFaceColors(animationData.start, colors);
    const colorEnd = getFaceColors(
      animationData.start.withVertices(animationData.endVertices),
      colors,
    );
    const allColorStart = arrayDefaults(colorStart, colorEnd);

    setPolyhedron(animationData.start);
    setFaceColors(allColorStart);

    transitionId.current = transition(
      {
        duration: 1000 / animationSpeed,
        startValue: {
          vertices: animationData.start.solidData.vertices,
          faceColors: allColorStart,
        },
        endValue: {
          vertices: animationData.endVertices,
          faceColors: arrayDefaults(colorEnd, colorStart),
        },
        onFinish: () => {
          setPolyhedron(result);
          setFaceColors(null);
        },
      },
      ({ vertices, faceColors }) => {
        setPolyhedron(animationData.start.withVertices(vertices));
        setFaceColors(faceColors);
      },
    );
  };

  const value = {
    polyhedron,
    faceColors,
    // TODO more secure way to calc this other than faceColors
    isTransitioning: !!faceColors,
    setPolyhedron,
    transitionPolyhedron,
    setName,
  };
  return (
    <PolyhedronContext.Provider value={value}>
      {children}
    </PolyhedronContext.Provider>
  );
}

export const WithPolyhedron = PolyhedronContext.Consumer;
