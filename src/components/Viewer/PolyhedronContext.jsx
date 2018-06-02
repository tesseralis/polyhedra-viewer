// @flow strict
import _ from 'lodash';
import React, { Component } from 'react';

import { defaultConfig } from 'constants/configOptions';
import { WithConfig } from 'components/ConfigContext';
import transition from 'transition';
import { Polyhedron } from 'math/polyhedra';
import { PRECISION } from 'math/linAlg';

function getCoplanarFaces(polyhedron) {
  const found = [];
  const pairs = [];
  _.forEach(polyhedron.faces, f1 => {
    if (f1.inSet(found)) return;

    _.forEach(f1.adjacentFaces(), f2 => {
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
  polyhedron: Polyhedron.get('tetrahedron'),
  config: defaultConfig,
  faceColors: [],
  isTransitioning: false,
  setPolyhedron: _.noop,
  transitionPolyhedron: _.noop,
  recenter: _.noop,
  resize: _.noop,
});

class BasePolyhedronProvider extends Component<*, *> {
  transitionId: *;

  constructor(props: *) {
    super(props);
    this.state = {
      polyhedron: Polyhedron.get('tetrahedron'),
      config: this.props.config,
      faceColors: [],
      isTransitioning: false,
      setPolyhedron: this.setPolyhedron,
      transitionPolyhedron: this.transitionPolyhedron,
      recenter: this.recenter,
      resize: this.resize,
    };
  }

  // Copy the config for ease of use
  static getDerivedStateFromProps({ config }) {
    return { config };
  }

  componentWillUnmount() {
    if (this.transitionId) {
      cancelAnimationFrame(this.transitionId.current);
    }
  }

  render() {
    return (
      <PolyhedronContext.Provider value={this.state}>
        {this.props.children}
      </PolyhedronContext.Provider>
    );
  }

  setPolyhedron = (name: string) => {
    this.setState({
      polyhedron: Polyhedron.get(name),
      faceColors: [],
    });
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
