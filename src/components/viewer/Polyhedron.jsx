// @flow
import React, { Component } from 'react';
import { rgb } from 'd3-color';
import _ from 'lodash';
import EventListener from 'react-event-listener';

import type { Operation } from 'polyhedra/applyOperation';
import SolidData from 'math/Polyhedron';
import polygons from 'constants/polygons';
import { mapObject } from 'util.js';
import {
  getCumulatePolygon,
  getAugmentFace,
  getAugmentGraph,
} from 'math/operations';

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

/* Faces */

// Convert the hex color to RGB
const toRgb = hex =>
  ['r', 'g', 'b'].map(_.propertyOf(rgb(hex))).map(d => d / 255);
const colorIndexForFace = mapObject(polygons, (n, i) => [n, i]);
const getColorIndex = face => colorIndexForFace[face.length];
const polygonColors = colors => polygons.map(n => toRgb(colors[n]));

interface FacesProps {
  solidData: SolidData;
  opacity: number;
  colors: any;
  colorMap: any;
  operation: ?Operation;
  applyOperation(op: Operation, args: any): void;
}

interface FacesState {
  applyArgs: any;
  augmentInfo?: any;
  error?: Error;
}

class Faces extends Component<FacesProps, FacesState> {
  shape: any;
  drag: boolean = false;

  constructor(props) {
    super(props);
    this.state = {
      applyArgs: {},
    };
    this.shape = React.createRef();
  }

  render() {
    const { solidData, opacity } = this.props;
    const { error } = this.state;
    const { vertices, faces } = solidData;

    if (error) {
      throw error;
    }
    // NOTE: The mouse handlers are duplicated to make it easy to test on enzyme.
    // They don't actually do anything in production
    return (
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
          solid="false"
          colorpervertex="false"
          coordindex={joinListOfLists(faces, ' -1 ', ' ')}
        >
          <Coordinates points={vertices} />
          <color color={this.getColors()} />
        </indexedfaceset>
      </shape>
    );
  }

  static getDerivedStateFromProps(props) {
    return {
      augmentInfo: getAugmentGraph(props.solidData),
    };
  }

  getColorForFace = (face, fIndex) => {
    const { applyArgs } = this.state;
    const { colors, colorMap } = this.props;
    const defaultColors = polygonColors(colors);

    // TODO pick better colors / have better effects
    if (_.isNumber(applyArgs.fIndex) && fIndex === applyArgs.fIndex) {
      return [0, 1, 0];
    }
    if (
      _.isObject(applyArgs.peak) &&
      _.includes(applyArgs.peak.faceIndices(), fIndex)
    ) {
      // return polygonColors(diminishColors)[getColorIndex(face)]
      return [1, 1, 0];
    }
    if (_.isNumber(applyArgs.polygon) && face.length === applyArgs.polygon) {
      return [1, 1, 0];
    }

    // If we specify that this face has a color, use it
    if (_.has(colorMap, fIndex.toString())) {
      return toRgb(colorMap[fIndex]);
    }
    return defaultColors[getColorIndex(face)];
  };

  getColors = () => {
    const { solidData: { faces } } = this.props;
    return joinListOfLists(faces.map(this.getColorForFace), ',', ' ');
  };

  // Manually adding event listeners swallows errors, so we have to store it in the component itself
  wrapError = (fn: any) => event => {
    try {
      fn(event);
    } catch (error) {
      this.setState({ error });
    }
  };

  addEventListener(type, fn: EventHandler) {
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
    const { operation, applyOperation } = this.props;
    const { applyArgs } = this.state;

    if (operation && !_.isEmpty(applyArgs)) {
      applyOperation(operation, applyArgs);
      // prevent the operation from doing something else
      if (operation !== 'g') {
        this.setState({ applyArgs: {} });
      }
    }
  };

  handleMouseMove = (event: any) => {
    // TODO replace this with logs
    this.drag = true;
    const { solidData, operation } = this.props;
    const { augmentInfo } = this.state;
    console.log('operation', operation);
    switch (operation) {
      case '+':
        const fIndex = getAugmentFace(solidData, augmentInfo, event.hitPnt);
        console.log('fIndex', fIndex);
        this.setState({
          applyArgs: fIndex === -1 ? {} : { fIndex },
        });
        return;
      case '-':
      case 'g':
        const peak = solidData.findPeak(event.hitPnt);
        console.log('peak', peak && peak.innerVertexIndices());
        this.setState({
          applyArgs: peak ? { peak } : {},
        });
        return;
      case 'k':
        const polygon = getCumulatePolygon(solidData, event.hitPnt);
        this.setState({
          applyArgs: polygon === -1 ? {} : { polygon },
        });
        return;
      default:
        return;
    }
  };

  handleMouseOut = () => {
    this.setState({ applyArgs: {} });
  };
}

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

/* Polyhedron */

interface PolyhedronProps {
  solidData: SolidData;
  config: any;
  operation?: Operation;
  applyOperation(operation: Operation, args: any): void;
  faceColors: any;
}

export default class Polyhedron extends Component<PolyhedronProps> {
  render() {
    const {
      solidData,
      config,
      operation,
      applyOperation,
      faceColors,
    } = this.props;

    const { edges, vertices } = solidData;
    const { showFaces, showEdges, colors, opacity } = config;

    return (
      <transform>
        {showFaces && (
          <Faces
            solidData={solidData}
            operation={operation}
            applyOperation={applyOperation}
            opacity={opacity}
            colors={colors}
            colorMap={faceColors}
          />
        )}
        {showEdges && <Edges edges={edges} vertices={vertices} />}
      </transform>
    );
  }
}
