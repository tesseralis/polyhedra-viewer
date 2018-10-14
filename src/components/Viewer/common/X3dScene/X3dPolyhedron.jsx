// @flow strict
import React, { Component, Fragment } from 'react';
import _ from 'lodash';
import EventListener from 'react-event-listener';

import { type Point } from 'types';
import { SolidData } from 'math/polyhedra';
import connect from 'components/connect';
import { WithConfig } from 'components/ConfigContext';
import { WithPolyhedron } from '../../context';
import SolidColors from './SolidColors';
import HitOptions from './HitOptions';

type SyntheticEventHandler = (e: $Subtype<SyntheticEvent<*>>) => void;

interface SyntheticX3DMouseEvent extends SyntheticEvent<> {
  hitPnt: Point;
}

// Join a list of lists with an inner and outer separator.
const joinListOfLists = (list: *, outerSep: string, innerSep: string) => {
  return _.map(list, elem => elem.join(innerSep)).join(outerSep);
};

const Coordinates = ({ points }) => {
  return <coordinate is="x3d" point={joinListOfLists(points, ', ', ' ')} />;
};

/* Edges */

const Edges = ({ edges, vertices }) => {
  return (
    <shape is="x3d">
      <indexedlineset is="x3d" coordindex={joinListOfLists(edges, ' -1 ', ' ')}>
        <Coordinates points={vertices} />
      </indexedlineset>
    </shape>
  );
};

interface PolyhedronProps {
  solidData: SolidData;
  config: *;
  colors: *;
  onClick(hitPnt: Point): void;
  onHover(hitPnt: Point): void;
  onMouseOut(): void;
}

interface PolyhedronState {
  error?: Error;
}

export class X3dPolyhedron extends Component<PolyhedronProps, PolyhedronState> {
  shape: *;
  hitPnt: * = undefined;

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
      <Fragment>
        <EventListener target="document" onLoad={_.once(this.handleLoad)} />
        {showFaces && (
          // NOTE: The mouse handlers are duplicated to make it easy to test on enzyme.
          // They don't actually do anything in production
          <shape
            is="x3d"
            ref={this.shape}
            onMouseDown={this.handleMouseDown}
            onMouseMove={this.handleMouseMove}
            onMouseUp={this.handleMouseUp}
            onMouseOut={this.handleMouseOut}
          >
            <appearance is="x3d">
              <material is="x3d" transparency={1 - opacity} />
            </appearance>
            <indexedfaceset
              is="x3d"
              solid={(!showInnerFaces).toString()}
              colorpervertex="false"
              coordindex={joinListOfLists(faces, ' -1 ', ' ')}
            >
              <Coordinates points={vertices} />
              <color is="x3d" color={this.getColors()} />
            </indexedfaceset>
          </shape>
        )}
        {showEdges && <Edges edges={edges} vertices={vertices} />}
      </Fragment>
    );
  }

  getColors = () => {
    return joinListOfLists(this.props.colors, ',', ' ');
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

  handleMouseDown = (event: SyntheticX3DMouseEvent) => {
    // logic to ensure drags aren't registered as clicks
    this.hitPnt = event.hitPnt;
  };

  handleMouseUp = (event: SyntheticX3DMouseEvent) => {
    if (!_.isEqual(this.hitPnt, event.hitPnt)) return;
    this.props.onClick(event.hitPnt);
  };

  handleMouseMove = (event: SyntheticX3DMouseEvent) => {
    this.hitPnt = event.hitPnt;
    this.props.onHover(event.hitPnt);
  };

  handleMouseOut = () => {
    this.props.onMouseOut();
  };
}

export default _.flow([
  connect(
    WithConfig,
    ['config'],
  ),
  connect(
    WithPolyhedron,
    ({ polyhedron }) => ({ solidData: polyhedron.solidData }),
  ),
  connect(
    SolidColors,
    ['colors'],
  ),
  connect(
    HitOptions,
    {
      onHover: 'setHitOption',
      onMouseOut: 'unsetHitOption',
      onClick: 'applyWithHitOption',
    },
  ),
])(X3dPolyhedron);
