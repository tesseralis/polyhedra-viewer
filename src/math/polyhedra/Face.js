// @flow
import _ from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';

import { replace, getCyclic } from 'util.js';
import Polyhedron from './Polyhedron';
import { VIndex, FIndex, Edge } from './solidTypes';
import EdgeObj from './Edge';
import Vertex from './Vertex';
import {
  PRECISION,
  getPlane,
  getCentroid,
  getNormal,
  getNormalRay,
} from 'math/linAlg';

function getEdge(v1: VIndex, v2: VIndex) {
  return v1 < v2 ? [v1, v2] : [v2, v1];
}

export default class Face {
  polyhedron: Polyhedron;
  fIndex: FIndex;
  face: VIndex[];
  vertices: Vertex[];
  vectors: $ReadOnly<Vec3D>[];

  constructor(polyhedron: Polyhedron, fIndex: FIndex) {
    this.polyhedron = polyhedron;
    this.fIndex = fIndex;
    this.face = polyhedron.faces[fIndex];
    this.vertices = _.map(this.face, vIndex => polyhedron.vertexObjs[vIndex]);
    this.vectors = _.map(this.vertices, 'vec');
  }

  get numSides() {
    return this.face.length;
  }

  vIndices() {
    return this.face;
  }

  getVertices() {
    return this.vertices;
  }

  nextVertex(vIndex: VIndex) {
    return getCyclic(this.face, this.face.indexOf(vIndex) + 1);
  }

  prevVertex(vIndex: VIndex) {
    return getCyclic(this.face, this.face.indexOf(vIndex) - 1);
  }

  replaceVertex(vIndex: VIndex, ...vIndices: VIndex[]) {
    return replace(this.face, this.face.indexOf(vIndex), ...vIndices);
  }

  getEdges(): Edge[] {
    return _.map(this.face, (vertex, i) => {
      return getEdge(vertex, getCyclic(this.face, i + 1));
    });
  }

  edges(): EdgeObj[] {
    return _.map(this.face, (vertex, i) => {
      return new EdgeObj(
        this.polyhedron,
        ...getEdge(vertex, getCyclic(this.face, i + 1)),
      );
    });
  }

  directedEdge(i: number) {
    const vIndex = getCyclic(this.face, i);
    return [vIndex, getCyclic(this.face, i + 1)];
  }

  directedEdges() {
    return _.map(this.face, (vIndex, i) => this.directedEdge(i));
  }

  // FIXME
  directedEdgeObj(i: number) {
    return new EdgeObj(this.polyhedron, ...this.directedEdge(i));
  }

  directedEdgeObjs() {
    return _.map(this.face, (vIndex, i) => this.directedEdgeObj(i));
  }

  numUniqueSides() {
    return _.countBy(
      this.directedEdgeObjs(),
      edge => edge.length() > PRECISION,
    );
  }

  // Return true if this face is the same as the given face (within a polyhedron)
  equals(other: Face) {
    return this.fIndex === other.fIndex;
    // return this.polyhedron === other.polyhedron && this.fIndex === other.fIndex;
  }

  inSet(faces: Face[]) {
    return _.some(faces, face => this.equals(face));
  }

  indexIn(faces: Face[]) {
    return _.findIndex(faces, face => this.equals(face));
  }

  /** Return the set of faces connected by an edge */
  adjacentFaces() {
    return this.polyhedron.faceGraph()[this.fIndex];
  }

  /** Return the set of faces that share a vertex to this face (including itself) */
  vertexAdjacentFaces() {
    return _(this.vertices)
      .flatMap(vertex => vertex.adjacentFaces())
      .uniqBy('fIndex')
      .value();
  }

  directedAdjacentFaces() {
    return _.map(this.directedEdgeObjs(), edge => edge.adjacentFaces()[1]);
  }

  edgeLength() {
    return this.directedEdgeObj(0).length();
  }

  plane() {
    return getPlane(this.vectors);
  }

  apothem() {
    return this.edgeLength() / (2 * Math.tan(Math.PI / this.numSides));
  }

  /** Return the centroid of the face given by the face index */
  centroid() {
    return getCentroid(this.vectors);
  }

  // TODO decide what should return a Vec3D and what should return an array
  distanceToCenter() {
    const origin = this.polyhedron.centroid();
    return origin.distanceTo(this.centroid());
  }

  /** Return the normal of the face given by the face index */
  normal() {
    return getNormal(this.vectors);
  }

  normalRay() {
    return getNormalRay(this.vectors);
  }

  isValid() {
    return _.every(this.directedEdgeObjs(), edge => edge.length() > PRECISION);
  }

  withPolyhedron(polyhedron: Polyhedron) {
    return new Face(polyhedron, this.fIndex);
  }
}
