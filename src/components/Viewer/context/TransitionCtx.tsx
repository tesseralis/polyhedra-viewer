import _ from 'lodash';

import React, { useRef, useEffect, useContext, useCallback } from 'react';
import { createHookedContext } from 'components/common';

import Config from 'components/ConfigCtx';
import PolyhedronCtx from './PolyhedronCtx';
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

function getFaceColors(polyhedron, colors) {
  const pairs = getCoplanarFaces(polyhedron);
  const mapping = {};
  _.forEach(pairs, ([f1, f2]) => {
    const numSides = f1.numSides + f2.numSides - 2;
    mapping[f1.index] = numSides;
    mapping[f2.index] = numSides;
  });

  return polyhedron.faces.map(
    face =>
      colors[_.get(mapping, face.index.toString(), face.numUniqueSides())],
  );
}

function arrayDefaults(first, second) {
  return _.map(first, (item, i) => (_.isNil(item) ? second[i] : item));
}

const defaultState = {
  solidData: null,
  faceColors: null,
  isTransitioning: false,
};
const InterpModel = createHookedContext(
  {
    reset: () => () => defaultState,
    set: (solidData, faceColors) => () => ({
      solidData,
      faceColors,
      isTransitioning: !!solidData,
    }),
  },
  defaultState,
);

const TransitionContext = React.createContext(_.noop);

function InnerProvider({ children }: any) {
  const transitionId = useRef(null);
  const { setPolyhedron } = PolyhedronCtx.useActions();
  const config = Config.useState();
  const { colors, animationSpeed, enableAnimation } = config;
  const anim = InterpModel.useActions();

  // Cancel the animation if the component we're a part of gets rerendered.
  useEffect(
    () => {
      return () => {
        if (transitionId.current) {
          transitionId.current.cancel();
        }
      };
    },
    [transitionId],
  );
  const transitionFn = useCallback(
    (result: Polyhedron, animationData: any) => {
      if (!enableAnimation || !animationData) {
        setPolyhedron(result);
        anim.reset();
        return;
      }

      const { start, endVertices } = animationData;
      const colorStart = getFaceColors(start, colors);
      const colorEnd = getFaceColors(start.withVertices(endVertices), colors);
      const allColorStart = arrayDefaults(colorStart, colorEnd);

      anim.set(start.solidData, allColorStart);

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
            anim.reset();
          },
        },
        ({ vertices, faceColors }) => {
          anim.set({ ...start.solidData, vertices }, faceColors);
        },
      );
    },
    [config],
  );

  return (
    <TransitionContext.Provider value={transitionFn}>
      {children}
    </TransitionContext.Provider>
  );
}

function Provider({ children }: any) {
  return (
    <InterpModel.Provider>
      <InnerProvider>{children}</InnerProvider>
    </InterpModel.Provider>
  );
}

function useTransition() {
  return useContext(TransitionContext);
}

export default {
  Provider,
  useState: InterpModel.useState,
  useTransition,
};
