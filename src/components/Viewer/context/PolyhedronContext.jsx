// @flow strict
import _ from 'lodash';
import React, { PureComponent } from 'react';

import { WithConfig } from 'components/ConfigContext';
import transition from 'transition';
import { Polyhedron } from 'math/polyhedra';
import { PRECISION } from 'math/linAlg';

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

const PolyhedronContext = React.createContext({
  solidName: 'tetrahedron',
  setName: _.noop,
  polyhedron: Polyhedron.get('tetrahedron'),
  faceColors: [],
  transitionApplied: false,
  isTransitioning: false,
  setPolyhedron: _.noop,
  transitionPolyhedron: _.noop,
  recenter: _.noop,
  resize: _.noop,
});

class BasePolyhedronProvider extends PureComponent<*, *> {
  transitionId: *;

  constructor(props: *) {
    super(props);
    this.state = {
      setName: this.props.setName,
      polyhedron: Polyhedron.get('tetrahedron'),
      faceColors: [],
      isTransitioning: false,
      transitionApplied: false,
      setPolyhedron: this.setPolyhedron,
      transitionPolyhedron: this.transitionPolyhedron,
      recenter: this.recenter,
      resize: this.resize,
    };
  }

  componentWillUnmount() {
    if (this.transitionId) {
      cancelAnimationFrame(this.transitionId.current);
    }
  }

  render() {
    const value = { ...this.state, solidName: this.props.name };
    return (
      <PolyhedronContext.Provider value={value}>
        {this.props.children}
      </PolyhedronContext.Provider>
    );
  }

  setPolyhedron = (name: string, callback?: () => void) => {
    this.setState(({ transitionApplied }) => {
      if (transitionApplied) {
        return { transitionApplied: false };
      }
      return {
        polyhedron: Polyhedron.get(name),
        faceColors: [],
      };
    }, callback);
  };

  recenter = () => {
    this.setState(({ polyhedron }) => ({
      polyhedron: polyhedron.center(),
    }));
  };

  resize = () => {
    this.setState(({ polyhedron }) => ({
      polyhedron: polyhedron.normalizeToVolume(5),
    }));
  };

  transitionPolyhedron = (result: Polyhedron, animationData: *) => {
    const { config } = this.props;
    const { colors, animationSpeed, enableAnimation } = config;

    if (!enableAnimation || !animationData) {
      return this.setState({
        transitionApplied: true,
        polyhedron: result,
      });
    }

    const colorStart = getFaceColors(animationData.start, colors);
    const colorEnd = getFaceColors(
      animationData.start.withVertices(animationData.endVertices),
      colors,
    );
    const allColorStart = arrayDefaults(colorStart, colorEnd);

    this.setState({
      transitionApplied: true,
      isTransitioning: true,
      polyhedron: animationData.start,
      faceColors: allColorStart,
    });

    this.transitionId = transition(
      {
        duration: 750 / animationSpeed,
        startValue: {
          vertices: animationData.start.solidData.vertices,
          faceColors: allColorStart,
        },
        endValue: {
          vertices: animationData.endVertices,
          faceColors: arrayDefaults(colorEnd, colorStart),
        },
        onFinish: () => {
          this.setState({
            polyhedron: result,
            faceColors: [],
            isTransitioning: false,
          });
        },
      },
      ({ vertices, faceColors }) => {
        this.setState({
          polyhedron: animationData.start.withVertices(vertices),
          faceColors,
        });
      },
    );
  };
}

export const PolyhedronProvider = (props: *) => (
  <WithConfig>
    {({ config }) => <BasePolyhedronProvider {...props} config={config} />}
  </WithConfig>
);

export const WithPolyhedron = PolyhedronContext.Consumer;
