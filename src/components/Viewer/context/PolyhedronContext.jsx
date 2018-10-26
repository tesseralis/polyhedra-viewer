// @flow strict
import _ from 'lodash';
import React, { PureComponent } from 'react';

import { WithConfig } from 'components/ConfigContext';
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

const actions = ['setPolyhedron', 'transitionPolyhedron', 'recenter', 'resize'];

const PolyhedronContext = React.createContext({
  ...defaultState,
  ...mapObject(actions, action => [action, _.noop]),
});

export default PolyhedronContext;

class BasePolyhedronProvider extends PureComponent<*, *> {
  transitionId: *;

  constructor(props: *) {
    super(props);
    this.state = {
      ...defaultState,
      ..._.pick(this, actions),
      polyhedron: Polyhedron.get(props.name),
      setName: props.setName,
    };
  }

  componentDidUpdate(prevProps) {
    const { name, disabled } = this.props;
    if (disabled && !prevProps.disabled) {
      this.setState({ faceColors: null });
    }

    if (disabled && name !== prevProps.name) {
      this.setState({
        polyhedron: Polyhedron.get(name),
      });
    }
  }

  componentWillUnmount() {
    if (this.transitionId) {
      cancelAnimationFrame(this.transitionId.current);
    }
  }

  render() {
    const value = {
      ...this.state,
      // TODO more secure way to calc this other than faceColors
      isTransitioning: !!this.state.faceColors,
    };
    return (
      <PolyhedronContext.Provider value={value}>
        {this.props.children}
      </PolyhedronContext.Provider>
    );
  }

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
      polyhedron: animationData.start,
      faceColors: allColorStart,
    });

    this.transitionId = transition(
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
          this.setState({
            polyhedron: result,
            faceColors: null,
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
