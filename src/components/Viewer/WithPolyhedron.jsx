// @flow strict
import _ from 'lodash';
import React, { Component } from 'react';

import { WithConfig } from 'components/ConfigContext';
import transition from 'transition';
import { mapObject } from 'util.js';
import { Polyhedron } from 'math/polyhedra';

function getFaceColors(polyhedron, colors) {
  return _.pickBy(
    mapObject(polyhedron.faces, (face, fIndex) => [
      fIndex,
      colors[face.numUniqueSides()],
    ]),
  );
}

class WithPolyhedron extends Component<*, *> {
  transitionId: *;

  constructor(props: *) {
    super(props);
    this.state = {
      polyhedron: Polyhedron.get('tetrahedron'),
      faceColors: {},
      isTransitioning: false,
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
    return this.props.children(this.state);
  }

  setPolyhedron = (name: string) => {
    this.setState({
      polyhedron: Polyhedron.get(name),
      faceColors: {},
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
    const { colors, transitionDuration, enableAnimation } = config;

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

    this.setState({
      isTransitioning: true,
      polyhedron: animationData.start,
      faceColors: { ...colorEnd, ...colorStart },
    });

    this.transitionId = transition(
      {
        duration: transitionDuration,
        startValue: {
          vertices: animationData.start.solidData.vertices,
          faceColors: { ...colorEnd, ...colorStart },
        },
        endValue: {
          vertices: animationData.endVertices,
          faceColors: { ...colorStart, ...colorEnd },
        },
        onFinish: () => {
          this.setState({
            polyhedron: result,
            faceColors: {},
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

export default (props: *) => (
  <WithConfig>
    {({ config }) => <WithPolyhedron {...props} config={config} />}
  </WithConfig>
);
