// @flow
import React, { Component } from 'react';
import _ from 'lodash';
import EventListener from 'react-event-listener';
import { Vec3D } from 'toxiclibsjs/geom';

import { vec } from 'math/linAlg';
import { Polyhedron } from 'math/polyhedra';

// Join a list of lists with an inner and outer separator.
export const joinListOfLists = (
  list: any[],
  outerSep: string,
  innerSep: string,
) => {
  return list.map(elem => elem.join(innerSep)).join(outerSep);
};

const Coordinates = ({ points }) => {
  // We pad the number of points in case we move from a solid with more vertices
  // to one with less, so that x3dom does accidentally map an index to a non-existing point
  const buffer = _.times(100, _.constant([0, 0, 0]));
  const bufferedPoints = points.concat(buffer);

  return <coordinate point={joinListOfLists(bufferedPoints, ', ', ' ')} />;
};

/* Edges */

const Edges = ({ edges, vertices }) => {
  return (
    <shape>
      <indexedlineset coordindex={joinListOfLists(edges, ' -1 ', ' ')}>
        <Coordinates points={vertices} />
      </indexedlineset>
    </shape>
  );
};

interface PolyhedronProps {
  // TODO Use the raw solid data (or vertices) instead
  // (can't do right now because the Page object relies on it)
  polyhedron: Polyhedron;
  config: any;
  faceColors: any;
  applyOperation(): void;
  setApplyArgs(hitPnt?: Vec3D): void;
}

interface PolyhedronState {
  error?: Error;
}

export default class X3dPolyhedron extends Component<
  PolyhedronProps,
  PolyhedronState,
> {
  shape: any;
  drag: boolean = false;

  constructor(props: PolyhedronProps) {
    super(props);
    this.state = {};
    this.shape = React.createRef();
  }

  render() {
    const { polyhedron, config } = this.props;
    const { error } = this.state;
    const { vertices, faces, edges } = polyhedron.toJSON();
    const { showFaces, showEdges, showInnerFaces, opacity } = config;

    if (error) {
      throw error;
    }
    return (
      <transform>
        {showFaces && (
          // NOTE: The mouse handlers are duplicated to make it easy to test on enzyme.
          // They don't actually do anything in production
          <shape
            ref={this.shape}
            onMouseDown={this.handleMouseDown}
            onMouseMove={this.handleMouseMove}
            onMouseUp={this.handleMouseUp}
            onMouseOut={this.handleMouseOut}
          >
            <EventListener target="document" onLoad={_.once(this.handleLoad)} />
            <appearance>
              <material transparency={1 - opacity} />
            </appearance>
            <indexedfaceset
              solid={(!showInnerFaces).toString()}
              colorpervertex="false"
              coordindex={joinListOfLists(faces, ' -1 ', ' ')}
            >
              <Coordinates points={vertices} />
              <color color={this.getColors()} />
            </indexedfaceset>
          </shape>
        )}
        {showEdges && <Edges edges={edges} vertices={vertices} />}
      </transform>
    );
  }

  getColors = () => {
    return joinListOfLists(this.props.faceColors, ',', ' ');
  };

  // Manually adding event listeners swallows errors, so we have to store it in the component itself
  wrapError = (fn: any) => (event: any) => {
    try {
      fn(event);
    } catch (error) {
      this.setState({ error });
    }
  };

  addEventListener(type: string, fn: EventHandler) {
    this.shape.current.addEventListener(type, this.wrapError(fn));
  }

  handleLoad = () => {
    this.addEventListener('mousedown', this.handleMouseDown);
    this.addEventListener('mouseup', this.handleMouseUp);
    this.addEventListener('mousemove', this.handleMouseMove);
    this.addEventListener('mouseout', this.handleMouseOut);
  };

  handleMouseDown = () => {
    // logic to ensure drags aren't registered as clicks
    this.drag = false;
  };

  handleMouseUp = () => {
    if (this.drag) return;
    const { applyOperation } = this.props;
    applyOperation();
  };

  handleMouseMove = (event: any) => {
    // TODO replace this with logs
    this.drag = true;
    const { setApplyArgs } = this.props;
    setApplyArgs(vec(event.hitPnt));
  };

  handleMouseOut = () => {
    this.props.setApplyArgs();
  };
}
