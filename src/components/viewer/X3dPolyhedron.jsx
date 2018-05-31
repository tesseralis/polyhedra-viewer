// @flow
import React, { Component } from 'react';
import _ from 'lodash';
import EventListener from 'react-event-listener';

import { type Point } from 'types';
import { SolidData } from 'math/polyhedra';
import { WithOperation } from 'components/Viewer/OperationContext';
import { WithPolyhedron } from './PolyhedronContext';

type SyntheticEventHandler = (e: $Subtype<SyntheticEvent<*>>) => void;

interface SyntheticX3DMouseEvent extends SyntheticEvent<> {
  hitPnt: Point;
}

// Join a list of lists with an inner and outer separator.
const joinListOfLists = (list: *, outerSep: string, innerSep: string) => {
  return _.map(list, elem => elem.join(innerSep)).join(outerSep);
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
  solidData: SolidData;
  config: *;
  faceColors: *;
  onClick(): void;
  onHover(hitPnt: Point): void;
  onMouseOut(): void;
}

interface PolyhedronState {
  error?: Error;
}

class X3dPolyhedron extends Component<PolyhedronProps, PolyhedronState> {
  shape: *;
  drag: boolean = false;

  constructor(props: PolyhedronProps) {
    super(props);
    this.state = {};
    this.shape = React.createRef();
  }

  render() {
    const { solidData, config } = this.props;
    const { error } = this.state;
    const { vertices, faces, edges } = solidData;
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
  wrapError = (fn: SyntheticEventHandler) => (event: SyntheticEvent<*>) => {
    try {
      fn(event);
    } catch (error) {
      this.setState({ error });
    }
  };

  addEventListener(type: string, fn: SyntheticEventHandler) {
    if (this.shape.current !== null) {
      this.shape.current.addEventListener(type, this.wrapError(fn));
    }
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
    this.props.onClick();
  };

  handleMouseMove = (event: SyntheticX3DMouseEvent) => {
    this.drag = true;
    this.props.onHover(event.hitPnt);
  };

  handleMouseOut = () => {
    this.props.onMouseOut();
  };
}

export default (props: *) => (
  <WithPolyhedron>
    {({ polyhedron, config }) => (
      <WithOperation>
        {({
          hitOptions,
          setHitOptions,
          applyOperation,
          unsetHitOptions,
          getColors,
        }) => (
          <X3dPolyhedron
            {...props}
            config={config}
            onHover={setHitOptions}
            onClick={() => !_.isEmpty(hitOptions) && applyOperation()}
            onMouseOut={unsetHitOptions}
            faceColors={getColors()}
            solidData={polyhedron.solidData}
          />
        )}
      </WithOperation>
    )}
  </WithPolyhedron>
);
